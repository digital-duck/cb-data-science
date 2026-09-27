"""Build a book-level super-graph from all chapter graph.yaml files.

Output: public/domains/graph.yaml

Merge rules
-----------
- Chapters are processed in sorted (chapter-number) order.
- First definition wins: the chapter that first introduces a concept keeps
  its `defines`, `composed_of`, and `tier`.
- If a later chapter re-lists a concept as a `primitive` (treating it as
  "already known"), the earlier, richer concept definition is kept and the
  primitive entry is discarded.
- If a concept name appears in multiple chapters as a `concept`, subsequent
  definitions are recorded in `also_in` (list of source_domain strings) but
  do not overwrite the canonical entry.
- Each node gains a `source_domain` attribute naming the chapter that
  contributed the canonical definition.
- Applications are unique by name; first definition wins (same rule as concepts).

Usage
-----
    python scripts/build_super_graph.py [--domains-dir public/domains] [--out public/domains/graph.yaml]
"""

from __future__ import annotations
import argparse
import glob
from pathlib import Path

import yaml


# ── YAML emitter that preserves insertion order and uses block style ──────────

class _BlockDumper(yaml.Dumper):
    pass

def _str_representer(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

_BlockDumper.add_representer(str, _str_representer)


def _ordered_dump(data, stream=None, **kwargs):
    return yaml.dump(data, stream, Dumper=_BlockDumper,
                     allow_unicode=True, default_flow_style=False,
                     sort_keys=False, **kwargs)


# ── Merge logic ───────────────────────────────────────────────────────────────

def _node_entry(attrs: dict, source_domain: str) -> dict:
    """Build a canonical node dict, injecting source_domain."""
    entry = dict(attrs)
    entry['source_domain'] = source_domain
    return entry


def merge_chapters(chapter_files: list[str]) -> dict:
    """Merge a sorted list of chapter graph.yaml paths into one super-graph dict."""
    super_primitives: dict[str, dict] = {}   # name → attrs + source_domain
    super_concepts:   dict[str, dict] = {}
    super_apps:       dict[str, dict] = {}

    chapter_ids: list[str] = []

    for path in chapter_files:
        parts = Path(path).parts
        # .../domains/<chapter_id>/input/graph.yaml
        chapter_id = parts[-3]
        chapter_ids.append(chapter_id)

        data = yaml.safe_load(Path(path).read_text())

        # ── primitives ─────────────────────────────────────────────────────
        for name, attrs in (data.get('primitives') or {}).items():
            attrs = attrs or {}
            if name in super_concepts:
                # Already defined as a richer concept — record the reuse, skip
                super_concepts[name].setdefault('also_in', []).append(chapter_id)
            elif name in super_primitives:
                super_primitives[name].setdefault('also_in', []).append(chapter_id)
            else:
                super_primitives[name] = _node_entry(attrs, chapter_id)

        # ── concepts ───────────────────────────────────────────────────────
        for name, attrs in (data.get('concepts') or {}).items():
            attrs = attrs or {}
            if name in super_concepts:
                super_concepts[name].setdefault('also_in', []).append(chapter_id)
            elif name in super_primitives:
                # Upgrade: concept definition is richer than primitive stub
                entry = _node_entry(attrs, chapter_id)
                entry.setdefault('also_in', []).append(
                    super_primitives.pop(name)['source_domain']
                )
                super_concepts[name] = entry
            else:
                super_concepts[name] = _node_entry(attrs, chapter_id)

        # ── applications ───────────────────────────────────────────────────
        for name, attrs in (data.get('applications') or {}).items():
            attrs = attrs or {}
            if name not in super_apps:
                super_apps[name] = _node_entry(attrs, chapter_id)
            else:
                super_apps[name].setdefault('also_in', []).append(chapter_id)

    # ── deduplicate also_in (preserve order, remove source_domain duplicate) ─
    for section in (super_primitives, super_concepts, super_apps):
        for node in section.values():
            if 'also_in' in node:
                seen = {node['source_domain']}
                unique = []
                for d in node['also_in']:
                    if d not in seen:
                        seen.add(d)
                        unique.append(d)
                if unique:
                    node['also_in'] = unique
                else:
                    del node['also_in']

    return {
        'domain': _book_id(chapter_files[0]),
        'chapters': chapter_ids,
        'primitives': super_primitives,
        'concepts': super_concepts,
        'applications': super_apps,
    }


def _book_id(first_chapter_path: str) -> str:
    """Derive a book-level id from the first chapter's domain directory name.

    graph_intro_ch01  →  graph_intro
    data_science_ch01 →  data_science
    """
    chapter_id = Path(first_chapter_path).parts[-3]
    # Strip trailing _chNN suffix
    import re
    return re.sub(r'_ch\d+$', '', chapter_id)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--domains-dir', default='public/domains',
                        help='Directory containing per-chapter domain subdirs (default: public/domains)')
    parser.add_argument('--out', default=None,
                        help='Output path (default: <domains-dir>/graph.yaml)')
    args = parser.parse_args()

    domains_dir = Path(args.domains_dir)
    out_path = Path(args.out) if args.out else domains_dir / 'graph.yaml'

    chapter_files = sorted(
        glob.glob(str(domains_dir / '*/input/graph.yaml'))
    )
    if not chapter_files:
        raise SystemExit(f'No chapter graph.yaml files found under {domains_dir}')

    print(f'Merging {len(chapter_files)} chapter(s) → {out_path}')
    for f in chapter_files:
        print(f'  {Path(f).parts[-3]}')

    super_graph = merge_chapters(chapter_files)

    n_prim = len(super_graph['primitives'])
    n_conc = len(super_graph['concepts'])
    n_app  = len(super_graph['applications'])
    print(f'\nSuper-graph: {n_prim} primitives, {n_conc} concepts, {n_app} applications')

    # Count cross-domain nodes (those with also_in)
    cross = sum(
        1 for section in (super_graph['primitives'], super_graph['concepts'], super_graph['applications'])
        for node in section.values()
        if 'also_in' in node
    )
    print(f'Cross-domain reuse: {cross} node(s) appear in more than one chapter')

    header = (
        "# Book-level super-graph — AUTO-GENERATED, do not edit by hand.\n"
        "# Run:  python scripts/build_super_graph.py\n"
        "#\n"
        "# Merges all chapter graphs; each node carries source_domain (canonical\n"
        "# definition) and optionally also_in (other chapters that reuse it).\n"
        "# Cross-domain primitives (concepts in an earlier chapter re-declared as\n"
        "# primitives in a later one) appear here with their full composed_of chain.\n"
        "# This file is never used for SPL generation — it exists for validation\n"
        "# and future book-level graph visualisation.\n"
    )
    out_path.write_text(header + _ordered_dump(super_graph))
    print(f'\nWrote {out_path}')


if __name__ == '__main__':
    main()
