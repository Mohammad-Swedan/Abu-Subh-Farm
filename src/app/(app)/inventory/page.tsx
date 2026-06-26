import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { parsePage, parseSearch, pageSlice, pageCountOf } from "@/lib/pagination";
import { PageHeader } from "@/components/shared";
import {
  listItems,
  countItems,
  listItemOptions,
} from "@/features/inventory/server/inventory.repository";
import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import { COPY, STRICT_COOKIE } from "@/features/inventory/constants";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Inventory screen — server component. Loads the active items (+ recent history)
 *  and the picker options, reads the per-screen strict-tracking toggle from a
 *  cookie, and renders the client shell. Money flows as integer fils throughout. */
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const sp = await searchParams;

  const cookieStore = await cookies();
  const strictMode = cookieStore.get(STRICT_COOKIE)?.value === "1";

  const q = parseSearch(first(sp.q));
  const requestedPage = parsePage(first(sp.page));

  const [total, itemOptions] = await Promise.all([
    countItems(q),
    listItemOptions(),
  ]);

  const { page, skip, take } = pageSlice(requestedPage, total);
  const pageCount = pageCountOf(total);
  const items = await listItems({ q, skip, take });

  return (
    <div className="space-y-4">
      <PageHeader title={COPY.title} description={COPY.subtitle} />
      <InventoryScreen
        items={items}
        itemOptions={itemOptions}
        strictMode={strictMode}
        page={page}
        pageCount={pageCount}
      />
    </div>
  );
}
