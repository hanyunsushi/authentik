"""Build a local text inventory of frontend source locations; never modify source."""

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".frontend-index"


def location(path, source, match):
    return {"file": str(path.relative_to(ROOT)), "line": source.count("\n", 0, match.start()) + 1}


def main():
    components, routes, locators, gaps = [], [], [], []
    classes = defaultdict(list)
    files = sorted(
        path
        for path in (ROOT / "web/src").rglob("*")
        if path.is_file() and path.suffix in {".ts", ".tsx", ".css"} and "locales" not in path.parts
    )
    for path in files:
        source = path.read_text()
        if path.suffix == ".css":
            continue
        for match in re.finditer(r'@customElement\(["\']([^"\']+)["\']\)', source):
            components.append({**location(path, source, match), "tag": match[1]})
        for match in re.finditer(r'new Route(?:<[^;]+?>)?\(\s*["\']([^"\']+)["\']', source):
            routes.append({**location(path, source, match), "path": match[1]})
        for match in re.finditer(
            r'\b(data-testid|data-test|data-design-id|data-row-id|id|role|aria-label)\s*=\s*["\']([^"\']*)["\']',
            source,
        ):
            locators.append(
                {**location(path, source, match), "attribute": match[1], "value": match[2]}
            )
        for match in re.finditer(r'\bclass\s*=\s*["\']([^"\']+)["\']', source):
            for name in match[1].split():
                if re.fullmatch(r"[\w-]+", name):
                    classes[name].append(location(path, source, match))
        for match in re.finditer(r"<([a-z][\w-]*)\b[^>]*>", source, re.DOTALL):
            tag = match[0]
            interactive = (
                match[1] in {"button", "input", "select", "textarea"}
                or (match[1] == "a" and "href=" in tag)
                or "@click=" in tag
                or 'role="button"' in tag
            )
            if interactive and not re.search(r"\bdata-testid\s*=", tag):
                gaps.append({**location(path, source, match), "tag": match[1]})
    OUTPUT.mkdir(exist_ok=True)
    maps = {
        "component-map": components,
        "route-map": routes,
        "locator-map": locators,
        "locator-gaps": gaps,
        "class-xref": dict(classes),
    }
    for name, entries in maps.items():
        (OUTPUT / f"{name}.json").write_text(
            json.dumps(entries, indent=2, ensure_ascii=False) + "\n"
        )
    summary = {
        "source_files": len(files),
        "components": len(components),
        "routes": len(routes),
        "locator_occurrences": len(locators),
        "interactive_candidates_without_testid": len(gaps),
        "method": "Text inventory; dynamic templates and expressions require manual review.",
    }
    (OUTPUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
