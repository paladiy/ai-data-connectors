import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Chip,
  Group,
  Kbd,
  MantineProvider,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import directory from "../generated/directory.json";

type Source = (typeof directory.sources)[number];

const METHOD_LABELS: Record<string, string> = {
  native_connector: "Native connector",
  remote_mcp: "Remote MCP",
  local_mcp: "Local MCP",
  data_platform: "Data platform",
  automation: "Automation",
  file_upload: "File export",
};
const methodLabel = (id: string) => METHOD_LABELS[id] ?? id;

const sources: Source[] = [...directory.sources].sort((a, b) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }),
);

const letterOf = (name: string) => {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};
const anchorOf = (letter: string) => `dx-${letter === "#" ? "other" : letter}`;
const plural = (n: number) => (n === 1 ? "source" : "sources");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

const methodCounts = new Map<string, number>();
for (const s of sources) for (const m of s.methods) methodCounts.set(m, (methodCounts.get(m) ?? 0) + 1);
const methods = [...methodCounts.entries()]
  .map(([id, count]) => ({ id, label: methodLabel(id), count }))
  .sort((a, b) => a.label.localeCompare(b.label));

const haystacks = new Map<string, string>(
  sources.map((s) => [
    s.slug,
    [s.name, s.aliases.join(" "), [...new Set(s.providers)].join(" ")].join(" ").toLowerCase(),
  ]),
);

/** Keeps Mantine in step with Starlight's theme switch (`<html data-theme>`). */
function ThemeBridge() {
  const { setColorScheme } = useMantineColorScheme();
  useEffect(() => {
    const read = () => setColorScheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [setColorScheme]);
  return null;
}

function SourceItem({ source }: { source: Source }) {
  const href = `/sources/${source.slug}/`;
  const name = (
    <Anchor className="dx-name" href={href} fw={600} underline="hover">
      {source.name}
    </Anchor>
  );
  const routes = (
    <Text size="sm" c="dimmed" component="span" style={{ whiteSpace: "nowrap" }}>
      <Text component="span" fw={600} c="var(--sl-color-white)" style={{ fontVariantNumeric: "tabular-nums" }}>
        {source.routes}
      </Text>{" "}
      {source.routes === 1 ? "route" : "routes"}
    </Text>
  );
  const badges = (
    <Group gap={6} wrap="wrap" aria-label="Connection methods">
      {source.methods.map((id) => (
        <Badge key={id} variant="outline" color="gray" radius="sm" size="sm" tt="none" fw={400}>
          {methodLabel(id)}
        </Badge>
      ))}
    </Group>
  );

  return (
    <Group className="dx-item dx-item-list" align="flex-start" wrap="nowrap" gap="lg" py="md" px="sm">
      <Stack gap={2} className="dx-col-name">
        {name}
        {source.aliases.length > 0 && (
          <Text size="xs" c="dimmed">
            Also searched as {source.aliases.join(", ")}
          </Text>
        )}
      </Stack>
      <Stack gap={8} className="dx-col-body">
        <Text size="sm" maw="70ch" c="var(--sl-color-text)">
          {source.summary}
        </Text>
        {badges}
      </Stack>
      <Box className="dx-col-routes">{routes}</Box>
    </Group>
  );
}

function DirectoryApp() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);

  // Restore state from the URL after hydration.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") ?? "");
    setActive((params.get("method") ?? "").split(",").filter((id) => methodCounts.has(id)));
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    const url = new URL(location.href);
    query.trim() ? url.searchParams.set("q", query.trim()) : url.searchParams.delete("q");
    active.length ? url.searchParams.set("method", active.join(",")) : url.searchParams.delete("method");
    history.replaceState(null, "", url);
  }, [query, active]);

  // Press "/" anywhere outside a field to start searching.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = terms.length > 0 || active.length > 0;

  const visible = useMemo(
    () =>
      sources.filter((s) => {
        const hay = haystacks.get(s.slug)!;
        return terms.every((t) => hay.includes(t)) && (active.length === 0 || s.methods.some((m) => active.includes(m)));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, active],
  );

  const groups = useMemo(() => {
    const out: Array<{ letter: string; items: Source[] }> = [];
    for (const s of visible) {
      const letter = letterOf(s.name);
      const last = out[out.length - 1];
      if (last && last.letter === letter) last.items.push(s);
      else out.push({ letter, items: [s] });
    }
    return out;
  }, [visible]);
  const live = new Set(groups.map((g) => g.letter));

  const reset = () => {
    setQuery("");
    setActive([]);
    inputRef.current?.focus();
  };

  const countText = filtered
    ? `${visible.length} of ${sources.length} ${plural(sources.length)}`
    : `${sources.length} ${plural(sources.length)}`;

  return (
    <section className="dx" aria-labelledby="dx-heading">
      <Stack gap="sm" className="dx-toolbar">
        <Title order={2} id="dx-heading" className="sr-only">
          Find a data source
        </Title>

        <Group gap="sm" wrap="wrap" align="stretch">
          <TextInput
            ref={inputRef}
            id="dx-search-input"
            type="search"
            flex={1}
            miw="14rem"
            aria-label="Search by source, alias, or provider"
            aria-describedby="dx-count"
            autoComplete="off"
            spellCheck={false}
            placeholder={`Search ${sources.length} ${plural(sources.length)}, for example GA4`}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            rightSection={query ? null : <Kbd aria-hidden="true">/</Kbd>}
            rightSectionWidth={36}
          />
        </Group>

        {methods.length > 0 && (
          <Chip.Group multiple value={active} onChange={setActive}>
            <Group gap={6} role="group" aria-label="Filter by connection method">
              <Text size="xs" fw={600} tt="uppercase" c="dimmed" mr={4}>
                Method
              </Text>
              {methods.map((m) => (
                <Chip key={m.id} value={m.id} size="xs" variant="outline">
                  {m.label} <span className="dx-chip-count">{m.count}</span>
                </Chip>
              ))}
              {filtered && (
                <Button variant="subtle" size="compact-xs" onClick={reset}>
                  Clear filters
                </Button>
              )}
            </Group>
          </Chip.Group>
        )}

        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <nav aria-label="Jump to letter">
            <Group gap={2}>
              {ALPHABET.map((letter) =>
                live.has(letter) ? (
                  <Anchor key={letter} href={`#${anchorOf(letter)}`} size="sm" fw={600} px={5} underline="hover">
                    {letter}
                  </Anchor>
                ) : (
                  <Text key={letter} size="sm" fw={600} px={5} c="dimmed" opacity={0.4} aria-hidden="true">
                    {letter}
                  </Text>
                ),
              )}
            </Group>
          </nav>
          <Text id="dx-count" size="sm" c="dimmed" role="status" aria-live="polite">
            {countText}
          </Text>
        </Group>
      </Stack>

      {sources.length === 0 ? (
        <Text py="xl">No sources have been added yet.</Text>
      ) : (
        <div className="dx-groups">
          {groups.map((group) => (
            <section key={group.letter} className="dx-group" id={anchorOf(group.letter)}>
              <Title order={3} className="dx-letter">
                {group.letter}
              </Title>
              <div className="dx-list">
                {group.items.map((s) => (
                  <SourceItem key={s.slug} source={s} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {visible.length === 0 && sources.length > 0 && (
        <Text py="xl">
          <strong>No source matches.</strong> Check the spelling, try the product's short name, or{" "}
          <Anchor component="button" type="button" onClick={reset}>
            clear the search and filters
          </Anchor>
          .
        </Text>
      )}

      <Text size="sm" mt="xl">
        <Anchor href="/about/">About this directory</Anchor>
      </Text>
    </section>
  );
}

export default function Directory() {
  return (
    <MantineProvider withGlobalClasses={false} defaultColorScheme="dark">
      <ThemeBridge />
      <DirectoryApp />
    </MantineProvider>
  );
}
