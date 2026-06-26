import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared";
import {
  listItems,
  listItemOptions,
} from "@/features/inventory/server/inventory.repository";
import { InventoryScreen } from "@/features/inventory/components/inventory-screen";
import { COPY, STRICT_COOKIE } from "@/features/inventory/constants";

/** Inventory screen — server component. Loads the active items (+ recent history)
 *  and the picker options, reads the per-screen strict-tracking toggle from a
 *  cookie, and renders the client shell. Money flows as integer fils throughout. */
export default async function InventoryPage() {
  await requireUser();

  const cookieStore = await cookies();
  const strictMode = cookieStore.get(STRICT_COOKIE)?.value === "1";

  const [items, itemOptions] = await Promise.all([
    listItems(),
    listItemOptions(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title={COPY.title} description={COPY.subtitle} />
      <InventoryScreen
        items={items}
        itemOptions={itemOptions}
        strictMode={strictMode}
      />
    </div>
  );
}
