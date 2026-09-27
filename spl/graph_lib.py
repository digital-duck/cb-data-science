"""graph_lib — shared, YAML-driven concept-graph algorithm library.

Part of recipe 74 (`cookbook/74_concept_book/`) — the proof that the
"concept graph → concept-book" pattern recipes 71/73 each ship a frozen,
domain-specific copy of (`linalg_graph.py` / `geometry_graph.py`) is actually
ONE domain-agnostic algorithm library plus a thin per-domain *data* file.

Recipe 71's `linalg_graph.py` is "fully vested" — working, tested, frozen —
and deliberately left untouched here. Instead, `{domain}_graph.yaml` files
in this directory hold the SAME domain content (generated losslessly from
the existing modules — see `generate_domain_yaml.py`), and every algorithm
below is the domain-agnostic half of `linalg_graph.py`/`geometry_graph.py`,
generalized to take that loaded data as an explicit argument instead of
reading a module-level `_PRIMITIVES`/`_CONCEPTS`/`_APPLICATIONS` global.

Public API
----------
load_domain(yaml_path)              → dict   (raw domain data: primitives/concepts/applications/...)
build(domain_data)                  → networkx.DiGraph
acyclic(graph)                      → bool
reducible(graph, primitives)        → bool
minimal(primitives, domain_data)    → bool
in_graph(graph, target)             → bool
ancestors(graph, target)            → set[str]
restrict(graph, needed)             → networkx.DiGraph
applications_of(graph, target)      → list[str]
new_primitives(section, primitives) → int
productivity_order(graph, weight)   → list[str]
gap(graph, target, learner_state)   → set[str]
learning_path(graph, target, ...)   → list[str]
first_radical_primitives(domain_data) → list[str]
both_radical_primitives(domain_data)  → list[str]
concept_names(domain_data)            → list[str]
primitive_names(domain_data)          → list[str]
verify_content(section, domain_data, verifier="")  → str   (single generic symbolic-check stub)
verify_right_triangle(a, b, c)                     → str   (exact a²+b²=c² over ℚ; sage|sympy)
verify_distance_squared(x1, y1, x2, y2, d2)        → str   (exact distance formula over ℚ; sage|sympy)
verify_polygon_area(vertices, claimed)             → str   (exact shoelace over ℚ; sage|sympy)
verify_momentum_conservation(m1,u1,m2,u2,v1,v2)    → str   (exact two-body p check over ℚ; sage|sympy)
verify_energy_conservation(m,g,v0,h0,v1,h1)        → str   (exact T+V ledger over ℚ; sage|sympy)
verify_sho_solution(solution)                      → str   (symbolic x''+ω²x ≡ 0 check; sage|sympy)
verify_character_lego(character, domain_data)      → str   (structural decomposition check; no CAS)
verify_balanced_equation(reactants, products)      → str   (exact integer atom ledger; no CAS)

Graph conventions — IDENTICAL to linalg_graph.py / geometry_graph.py
--------------------------------------------------------------------
Node attributes:
    kind       : "primitive" | "concept" | "application"
    tier       : int (0 = primitive floor; higher = more composed)
    composed_of: list[str] (direct prerequisites; empty for primitives)
    ... plus whatever domain-specific keys the YAML carries through verbatim
        (symbol, defines, verifier, lab, play, introduced_in, domain, needs, ...)

Edge direction:
    u → v  means  "u is a prerequisite of v"
    (primitives are sources; targets/applications are sinks)
"""

from __future__ import annotations

import heapq
from pathlib import Path
from typing import Any, Iterable

import networkx as nx
import yaml


# ---------------------------------------------------------------------------
# Domain data loading
# ---------------------------------------------------------------------------

def load_domain(yaml_path: str | Path) -> dict[str, Any]:
    """Load a `{domain}_graph.yaml` file into the raw domain-data dict.

    Returns a dict shaped like::

        {
            "domain": "linalg",
            "primitives": {name: {attrs...}, ...},
            "concepts":   {name: {"composed_of": [...], attrs...}, ...},
            "applications": {name: {"needs": [...], attrs...}, ...},
            "first_radical_primitives": [name, ...],
        }

    — the same shape `build()` and the data-driven accessors below expect,
    generated losslessly from `_PRIMITIVES`/`_CONCEPTS`/`_APPLICATIONS` (see
    `generate_domain_yaml.py`). Resolved relative to this file's directory
    when given a bare filename, so callers don't need to know where recipe
    74 lives on disk.
    """
    path = Path(yaml_path)
    if not path.is_absolute() and not path.exists():
        path = Path(__file__).parent / path
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


# ---------------------------------------------------------------------------
# Graph builder — generalized from linalg_graph.build()/geometry_graph.build()
# ---------------------------------------------------------------------------

def build(domain_data: dict[str, Any]) -> nx.DiGraph:
    """Build and return the full concept graph for a loaded domain.

    Nodes carry all metadata from the raw data dicts plus a ``kind``
    attribute. Edges u → v mean "u is a prerequisite of v". Identical
    construction to `linalg_graph.build()` / `geometry_graph.build()`,
    generalized to read from `domain_data` instead of module globals.
    """
    G = nx.DiGraph()

    for name, attrs in domain_data.get("primitives", {}).items():
        G.add_node(name, kind="primitive", composed_of=[], **attrs)

    for name, attrs in domain_data.get("concepts", {}).items():
        composed_of = attrs.get("composed_of", [])
        node_attrs = {k: v for k, v in attrs.items() if k != "composed_of"}
        G.add_node(name, kind="concept", composed_of=composed_of, **node_attrs)
        for prereq in composed_of:
            G.add_edge(prereq, name)

    for name, attrs in domain_data.get("applications", {}).items():
        needs = attrs.get("needs", [])
        node_attrs = {k: v for k, v in attrs.items() if k != "needs"}
        G.add_node(name, kind="application", composed_of=needs, **node_attrs)
        for prereq in needs:
            G.add_edge(prereq, name)

    return G


# ---------------------------------------------------------------------------
# Graph algorithms — copied verbatim from linalg_graph.py (domain-agnostic;
# operate purely on the built nx.DiGraph, never on raw domain data)
# ---------------------------------------------------------------------------

def acyclic(graph: nx.DiGraph) -> bool:
    """Return True if the graph has no cycles (valid composition hierarchy)."""
    return nx.is_directed_acyclic_graph(graph)


def reducible(graph: nx.DiGraph, primitives: Iterable[str]) -> bool:
    """Return True if every concept/application reduces transitively to primitives.

    A root (in-degree 0 ancestor) is valid if it is either a declared primitive
    OR an explicitly-declared node with no prerequisites (a foundation concept
    whose composed_of list is empty — treated as given in this domain). Nodes
    that appear only in composed_of/needs lists but were never declared have no
    'kind' attribute (NetworkX adds them implicitly via G.add_edge); those are
    the only invalid roots.
    """
    prim_set = set(primitives)
    for node in graph.nodes():
        if graph.nodes[node].get("kind") == "primitive":
            continue
        anc = nx.ancestors(graph, node)
        sources = {n for n in anc if graph.in_degree(n) == 0}
        invalid = {n for n in sources if n not in prim_set and "kind" not in graph.nodes[n]}
        if invalid:
            return False
    return True


def minimal(primitives: Iterable[str], domain_data: dict[str, Any]) -> bool:
    """Return True if all supplied names are declared primitives for this domain.

    Generalized from `linalg_graph.minimal()`, which checked against the
    module-level `_PRIMITIVES` global — here the declared set comes from the
    loaded `domain_data` instead.
    """
    prim_set = set(primitives)
    declared = set(domain_data.get("primitives", {}).keys())
    return prim_set.issubset(declared)


def in_graph(graph: nx.DiGraph, target: str) -> bool:
    """Return True if target names a node in the graph."""
    return target in graph.nodes()


def ancestors(graph: nx.DiGraph, target: str) -> set[str]:
    """Return the composed-of closure — all nodes that transitively feed target."""
    return nx.ancestors(graph, target)


def restrict(graph: nx.DiGraph, needed: Iterable[str]) -> nx.DiGraph:
    """Return the subgraph induced by the given node set.

    Only nodes in *needed* are kept; edges between them are preserved.
    """
    return graph.subgraph(set(needed)).copy()


def applications_of(graph: nx.DiGraph, target: str) -> list[str]:
    """Return applications that directly depend on target."""
    return [
        n for n in graph.successors(target)
        if graph.nodes[n].get("kind") == "application"
    ]


def new_primitives(section: str, primitives: Iterable[str]) -> int:
    """Count how many primitive names appear in a section text.

    Used to enforce the ``primitive_budget`` rule: a section should not
    introduce more new radicals than the budget allows. Generalized from
    `linalg_graph.new_primitives()` — `primitives` is now a required
    argument (was an optional fallback to the module-level `_PRIMITIVES`
    global; callers pass `both_radical_primitives(domain_data)` instead).
    """
    section_lower = section.lower()
    count = 0
    for prim in primitives:
        canonical = prim.replace("_", " ")
        if canonical in section_lower or prim in section_lower:
            count += 1
    return count


# ---------------------------------------------------------------------------
# productivity_order — reach-weighted topological sort (verbatim)
# ---------------------------------------------------------------------------

def productivity_order(graph: nx.DiGraph, weight: float = 1.0) -> list[str]:
    """Return concepts in order: topological, tie-broken by payoff-weighted reach.

    reach(c) = (# concepts c is ancestor of) + weight * (# applications c is ancestor of)

    A concept with high reach "unlocks" many downstream concepts and
    applications when learned — it should be taught as early as topology
    allows. Implementation: modified Kahn's algorithm with a max-heap
    priority queue. Identical to `linalg_graph.productivity_order()`.
    """
    reach: dict[str, float] = {}
    for node in graph.nodes():
        desc = nx.descendants(graph, node)
        n_concepts = sum(1 for d in desc if graph.nodes[d].get("kind") == "concept")
        n_apps = sum(1 for d in desc if graph.nodes[d].get("kind") == "application")
        reach[node] = n_concepts + weight * n_apps

    in_deg: dict[str, int] = dict(graph.in_degree())
    heap: list[tuple[float, str]] = []
    for n, d in in_deg.items():
        if d == 0:
            heapq.heappush(heap, (-reach[n], n))

    result: list[str] = []
    while heap:
        _, node = heapq.heappop(heap)
        result.append(node)
        for succ in graph.successors(node):
            in_deg[succ] -= 1
            if in_deg[succ] == 0:
                heapq.heappush(heap, (-reach[succ], succ))

    return result


def gap(graph: nx.DiGraph, target: str, learner_state: Iterable[str]) -> set[str]:
    """Concepts needed to reach target that the learner has not yet mastered.

    Returns ancestors(graph, target) minus learner_state.
    """
    return ancestors(graph, target).difference(set(learner_state))


def learning_path(graph: nx.DiGraph, target: str, learner_state: Iterable[str],
                  weight: float = 1.0) -> list[str]:
    """Productivity-ordered list of concepts a learner still needs for target.

    Equivalent to productivity_order(restrict(graph, gap(graph, target, learner_state))).
    """
    needed = gap(graph, target, learner_state)
    if not needed:
        return []
    return productivity_order(restrict(graph, needed), weight=weight)


# ---------------------------------------------------------------------------
# Domain-data accessors — generalized from linalg_graph.py's module-global
# convenience functions (`first_radical_primitives`, `both_radical_primitives`,
# `concept_names`, `primitive_names`) to read from the loaded `domain_data`
# instead. Behavior is identical; only the source of truth moved from a
# Python module global to a YAML-loaded dict.
# ---------------------------------------------------------------------------

def first_radical_primitives(domain_data: dict[str, Any]) -> list[str]:
    """Return the curated "first radical only" primitive subset for this domain.

    This is genuinely domain-specific *content* (a hand-picked subset, not a
    derived quantity) — e.g. linalg's `[field_of_scalars, carrier_set,
    vector_addition, scalar_multiplication]` or geometry's `[point, line,
    plane, distance]` — so it is declared explicitly in the YAML rather than
    computed.
    """
    return list(domain_data.get("first_radical_primitives", []))


def both_radical_primitives(domain_data: dict[str, Any]) -> list[str]:
    """Return all declared primitives for this domain (both radicals)."""
    return list(domain_data.get("primitives", {}).keys())


def concept_names(domain_data: dict[str, Any]) -> list[str]:
    """Return all concept names in declaration order."""
    return list(domain_data.get("concepts", {}).keys())


def primitive_names(domain_data: dict[str, Any]) -> list[str]:
    """Return all primitive names in declaration order."""
    return list(domain_data.get("primitives", {}).keys())


# ---------------------------------------------------------------------------
# Generic verifier — the single symbolic-check shape every domain plugs into
# ---------------------------------------------------------------------------

def verify_content(section: str, domain_data: dict[str, Any],
                   verifier: str = "") -> str:
    """Domain-dispatched symbolic check. Returns 'pass' or a failure description.

    Recipes 71/73 each declare their own verifier(s) (`verify_math` +
    `shape_check`, `verify_geometry`) because their oracles are genuinely
    different SymPy submodules. Recipe 74's whole point is ONE `.spl` source
    compiling against *either* domain, so it needs ONE verifier shape; this
    dispatches on `domain_data["domain"]` to the right SymPy presence-check —
    proving the *shape* generalizes even though the oracle's specifics
    (worked-example recompute, geometry recompute, ...) remain TODO stubs in
    71/73 too. A third domain adds a branch here, not a new `.spl` construct.

    `verifier` (optional) is an explicit engine override, matching the
    per-node `verifier:` YAML attribute ("sympy" | "z3" | "numpy" | "sage" |
    "sage|sympy"). "sage" dispatches to SageMath; "sage|sympy" prefers Sage
    and falls back to SymPy when Sage is absent (the fallback-tiering policy —
    see SPL.py/docs/DEV/sage_lean_integration_plan.md §A.2). When empty, the
    domain default applies.
    """
    engines = [e.strip() for e in verifier.split("|") if e.strip()] or ["_domain_default"]
    last_exc: Exception | None = None
    for engine in engines:
        try:
            if engine == "sage":
                import sage.all  # noqa: F401 — presence check
            elif engine == "lean":
                # Part B's bridge (parallel session). Until it lands, "lean|sympy"
                # nodes fall through to sympy; afterwards lean becomes the
                # engine-of-record automatically — no YAML edits needed.
                import spl3.lean_bridge  # noqa: F401 — presence check
            elif engine == "structural":
                # Graph-structural domains (chinese_characters): the oracle
                # is graph_lib itself — nothing external to import.
                pass
            elif engine == "_domain_default":
                if domain_data.get("domain", "") == "intro_geometry":
                    import sympy.geometry  # noqa: F401 — presence check
                else:
                    import sympy  # noqa: F401 — presence check
            else:  # sympy / z3 / numpy
                __import__("sympy" if engine == "sympy" else engine)
            # TODO: parse claims from section and recompute per-domain
            return "pass" if engine == "_domain_default" else f"pass ({engine})"
        except Exception as exc:
            last_exc = exc
    return f"fail: {last_exc}"


# ---------------------------------------------------------------------------
# Exact worked-example verifiers (A-4) — real recomputation, not presence checks
#
# Each tries the engines named in `verifier` left to right ("sage|sympy" =
# prefer Sage, fall back to SymPy when Sage is absent). Fallback applies to
# ENGINE ABSENCE only — once an engine computes, its verdict is final and the
# engine-of-record is reported: 'pass (sage)' / 'fail: ... (sympy)'. All
# arithmetic is exact over the rationals; no floating point anywhere.
# ---------------------------------------------------------------------------

def _engines(verifier: str) -> list[str]:
    return [e.strip() for e in verifier.split("|") if e.strip()]


def verify_right_triangle(a, b, c, verifier: str = "sage|sympy") -> str:
    """Exact Pythagorean check: a² + b² == c² over ℚ (legs a, b; hypotenuse c).

    Verifies the worked example for the `pythagorean_theorem` concept node.
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import QQ
                ok = QQ(a) ** 2 + QQ(b) ** 2 == QQ(c) ** 2
            else:
                from sympy import Rational
                ok = Rational(a) ** 2 + Rational(b) ** 2 == Rational(c) ** 2
            if ok:
                return f"pass ({engine})"
            return f"fail: {a}**2 + {b}**2 != {c}**2 (exact, {engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


def verify_distance_squared(x1, y1, x2, y2, claimed_d_squared,
                            verifier: str = "sage|sympy") -> str:
    """Exact distance-formula check: (x₂−x₁)² + (y₂−y₁)² == claimed d² over ℚ.

    Verifies the worked example for the `distance_formula` concept node.
    Comparing d² keeps everything in ℚ — no square roots, no floats.
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import QQ
                d2 = (QQ(x2) - QQ(x1)) ** 2 + (QQ(y2) - QQ(y1)) ** 2
                ok = d2 == QQ(claimed_d_squared)
            else:
                from sympy import Rational
                d2 = (Rational(x2) - Rational(x1)) ** 2 + (Rational(y2) - Rational(y1)) ** 2
                ok = d2 == Rational(claimed_d_squared)
            if ok:
                return f"pass ({engine})"
            return f"fail: d^2 = {d2} != {claimed_d_squared} (exact, {engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


def verify_polygon_area(vertices, claimed_area, verifier: str = "sage|sympy") -> str:
    """Exact shoelace-formula check: area of the polygon == claimed value over ℚ.

    Verifies the worked example for the `area` concept node. `vertices` is a
    sequence of (x, y) pairs in traversal order (either orientation).
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import QQ
                num = QQ
            else:
                from sympy import Rational
                num = Rational
            pts = [(num(x), num(y)) for x, y in vertices]
            twice = sum(
                pts[i][0] * pts[(i + 1) % len(pts)][1]
                - pts[(i + 1) % len(pts)][0] * pts[i][1]
                for i in range(len(pts))
            )
            area = abs(twice) / 2
            if area == num(claimed_area):
                return f"pass ({engine})"
            return f"fail: shoelace area = {area} != {claimed_area} (exact, {engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


# ---------------------------------------------------------------------------
# Exact mechanics verifiers — same shape as the geometry ones above
# (engine absence falls through sage→sympy; a computed verdict is final).
# ---------------------------------------------------------------------------

def verify_momentum_conservation(m1, u1, m2, u2, v1, v2,
                                 verifier: str = "sage|sympy") -> str:
    """Exact two-body momentum check: m₁u₁ + m₂u₂ == m₁v₁ + m₂v₂ over ℚ.

    Verifies the worked example for the `momentum` concept node
    (u = velocities before the collision, v = after).
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import QQ as num
            else:
                from sympy import Rational as num
            before = num(m1) * num(u1) + num(m2) * num(u2)
            after = num(m1) * num(v1) + num(m2) * num(v2)
            if before == after:
                return f"pass ({engine})"
            return f"fail: p_before = {before} != p_after = {after} (exact, {engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


def verify_energy_conservation(m, g, v0, h0, v1, h1,
                               verifier: str = "sage|sympy") -> str:
    """Exact mechanical-energy check: ½mv₀² + mgh₀ == ½mv₁² + mgh₁ over ℚ.

    Verifies the worked example for the `energy_conservation` concept node
    (state 0 → state 1 under gravity alone).
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import QQ as num
            else:
                from sympy import Rational as num
            e0 = num(m) * num(v0) ** 2 / 2 + num(m) * num(g) * num(h0)
            e1 = num(m) * num(v1) ** 2 / 2 + num(m) * num(g) * num(h1)
            if e0 == e1:
                return f"pass ({engine})"
            return f"fail: E_0 = {e0} != E_1 = {e1} (exact, {engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


def verify_sho_solution(solution: str = "A*cos(w*t) + B*sin(w*t)",
                        verifier: str = "sage|sympy") -> str:
    """Symbolic check that x(t) solves the simple harmonic oscillator.

    Substitutes the candidate into x'' + ω²·x and verifies it vanishes
    *identically* (symbolic differentiation + simplification — a genuinely
    CAS-strength check, not numeric sampling). Free symbols: t, w, A, B.
    Verifies the worked example for the `harmonic_oscillator` concept node.
    """
    last_exc: Exception | None = None
    for engine in _engines(verifier):
        try:
            if engine == "sage":
                from sage.all import SR, var, diff
                t, w, A, B = var("t w A B")
                x = SR(solution)
                # NB: `expr == 0` builds a symbolic *equation* in Sage —
                # is_zero() is the boolean identity test.
                residual = (diff(x, t, 2) + w**2 * x).simplify_full()
                ok = residual.is_zero()
            else:
                import sympy
                t, w, A, B = sympy.symbols("t w A B")
                x = sympy.sympify(solution, locals={"t": t, "w": w, "A": A, "B": B})
                residual = sympy.simplify(sympy.diff(x, t, 2) + w**2 * x)
                ok = residual == 0
            if ok:
                return f"pass ({engine})"
            return f"fail: x'' + w^2 x = {residual} != 0 for x = {solution} ({engine})"
        except ImportError as exc:
            last_exc = exc
    return f"fail: no verifier engine available ({last_exc})"


# ---------------------------------------------------------------------------
# Structural verifier — chinese_characters (and any future decomposition
# domain). The oracle here is the graph itself, not a CAS: a character's
# claimed brick multiset must agree with what the graph derives.
# ---------------------------------------------------------------------------

def verify_character_lego(character: str, domain_data: dict[str, Any]) -> str:
    """Structural LEGO check for one node of a decomposition domain.

    Verifies the worked example of every character concept node in
    `chinese_characters_graph.yaml` (their ``lab`` attribute names this
    function). Three checks, all against the built graph:

    1. every ``composed_of`` entry is a node in the graph,
    2. every claimed ``pieces`` brick is a declared primitive,
    3. set(``pieces``) equals the node's primitive ancestor set — the claimed
       bricks are exactly the bricks the graph derives.

    ``pieces`` is a *multiset* (林 = two 木) while graph edges cannot repeat,
    so multiplicity lives only in ``pieces``; the graph cross-check is on the
    underlying set. Principle nodes (形声 et al.) carry no ``pieces`` — for
    them the check degrades to per-node reducibility: every in-degree-0
    ancestor must be a declared primitive. Primitives pass trivially: a brick
    is its own decomposition.
    """
    graph = build(domain_data)
    if character not in graph:
        return f"fail: {character!r} is not a node in the {domain_data.get('domain')} graph"
    node = graph.nodes[character]
    bricks = set(both_radical_primitives(domain_data))

    if node.get("kind") == "primitive":
        return "pass (structural)"

    missing = [p for p in node.get("composed_of", []) if p not in graph]
    if missing:
        return f"fail: composed_of references unknown node(s) {missing}"

    derived = {a for a in nx.ancestors(graph, character)
               if graph.nodes[a].get("kind") == "primitive"}

    pieces = node.get("pieces")
    if pieces is None:
        leaves = {a for a in nx.ancestors(graph, character)
                  if graph.in_degree(a) == 0}
        if leaves.issubset(bricks):
            return "pass (structural)"
        return f"fail: {character} has non-primitive leaf ancestor(s) {sorted(leaves - bricks)}"

    undeclared = [p for p in pieces if p not in bricks]
    if undeclared:
        return f"fail: pieces of {character} include undeclared brick(s) {undeclared}"
    if set(pieces) != derived:
        return (f"fail: pieces of {character} claim bricks {sorted(set(pieces))} "
                f"but the graph derives {sorted(derived)}")
    return "pass (structural)"


def verify_balanced_equation(reactants, products) -> str:
    """Exact atom-ledger check: bricks rearrange, never appear or vanish.

    Verifies the worked example for the `conservation_of_atoms` node of
    `chemistry_elements_graph.yaml`. Each side is a list of
    ``(coefficient, pieces)`` pairs, where ``pieces`` is a formula node's
    brick multiset — e.g. 2H₂ + O₂ → 2H₂O is::

        verify_balanced_equation([(2, ["H", "H"]), (1, ["O", "O"])],
                                 [(2, ["H", "H", "O"])])

    Pure integer arithmetic over Counters — exact by construction, no CAS
    engine to dispatch (the structural domains' analog of the ℚ verifiers).
    """
    from collections import Counter

    def ledger(side) -> Counter:
        total: Counter = Counter()
        for coefficient, pieces in side:
            for brick in pieces:
                total[brick] += coefficient
        return total

    lhs, rhs = ledger(reactants), ledger(products)
    if lhs == rhs:
        return "pass (exact)"
    return (f"fail: atom ledger does not balance — "
            f"reactants {dict(sorted(lhs.items()))} != products {dict(sorted(rhs.items()))}")


# ---------------------------------------------------------------------------
# Quick smoke-test (python graph_lib.py <domain_yaml>)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    yaml_name = sys.argv[1] if len(sys.argv) > 1 else "linalg_graph.yaml"
    data = load_domain(yaml_name)
    graph = build(data)
    print(f"Domain: {data.get('domain')}")
    print(f"Nodes: {graph.number_of_nodes()}  Edges: {graph.number_of_edges()}")
    print(f"Acyclic: {acyclic(graph)}")
    first = first_radical_primitives(data)
    both = both_radical_primitives(data)
    print(f"Reducible (first radical {first}): {reducible(graph, first)}")
    print(f"Reducible (both radicals {both}): {reducible(graph, both)}")
    order = productivity_order(graph, weight=2.0)
    print(f"\nProductivity order ({len(order)} nodes):")
    for i, n in enumerate(order, 1):
        kind = graph.nodes[n].get("kind", "?")
        print(f"  {i:2}. [{kind:12}] {n}")
