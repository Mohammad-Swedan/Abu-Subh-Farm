"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PlusIcon, SearchIcon, SproutIcon } from "lucide-react"
import type { Crop } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { EmptyState, FormError, ConfirmDialog } from "@/components/shared"

import {
  createCropSchema,
  type CreateCropInput,
} from "../schemas/crop.schema"
import { COPY } from "../constants"
import {
  createCropAction,
  updateCropAction,
  setCropActiveAction,
} from "../server/crops.actions"

export type CropsManagerProps = {
  crops: Crop[]
}

type CropFormValues = { nameAr: string }

function CropFormSheet({
  open,
  onOpenChange,
  mode,
  crop,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  crop?: Crop
  onSaved: () => void
}) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CropFormValues>({
    resolver: zodResolver(createCropSchema) as unknown as Resolver<CropFormValues>,
    defaultValues: { nameAr: crop?.nameAr ?? "" },
  })

  // Prefill when the sheet opens or the edited crop changes.
  React.useEffect(() => {
    if (open) reset({ nameAr: crop?.nameAr ?? "" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, crop?.id])

  const onSubmit = handleSubmit(async (values: CreateCropInput) => {
    setPending(true)
    try {
      const res =
        mode === "edit" && crop
          ? await updateCropAction({ id: crop.id, nameAr: values.nameAr })
          : await createCropAction({ nameAr: values.nameAr })
      if (!res.ok) {
        const fieldErrors = res.error.fieldErrors
        if (fieldErrors) {
          for (const [key, message] of Object.entries(fieldErrors)) {
            setError(key as keyof CropFormValues, { message })
          }
        }
        toast.error(res.error.message)
        return
      }
      toast.success(mode === "create" ? COPY.saved : COPY.edited)
      reset({ nameAr: "" })
      onOpenChange(false)
      onSaved()
    } finally {
      setPending(false)
    }
  })

  async function handleToggleActive() {
    if (!crop) return
    setPending(true)
    try {
      const res = await setCropActiveAction({
        id: crop.id,
        isActive: !crop.isActive,
      })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success(crop.isActive ? COPY.deactivated : COPY.activated)
      onOpenChange(false)
      onSaved()
    } finally {
      setPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {mode === "create" ? COPY.addTitle : COPY.editTitle}
          </SheetTitle>
          <SheetDescription>{COPY.formDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor="crop-name">{COPY.name}</Label>
            <Controller
              control={control}
              name="nameAr"
              render={({ field }) => (
                <Input
                  id="crop-name"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                  className="h-12"
                />
              )}
            />
            <FormError message={errors.nameAr?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-14 w-full text-lg"
            disabled={pending}
          >
            {mode === "create" ? COPY.save : COPY.saveEdit}
          </Button>

          {mode === "edit" && crop ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full"
                  disabled={pending}
                >
                  {crop.isActive ? COPY.deactivate : COPY.activate}
                </Button>
              }
              title={crop.isActive ? COPY.deactivateTitle : COPY.activate}
              description={crop.isActive ? COPY.deactivateDescription : undefined}
              confirmLabel={crop.isActive ? COPY.deactivate : COPY.activate}
              destructive={crop.isActive}
              onConfirm={handleToggleActive}
            />
          ) : null}
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** Settings section to add / rename / hide crops (المحاصيل). */
export function CropsManager({ crops }: CropsManagerProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Crop | undefined>(undefined)
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim()
    if (!q) return crops
    return crops.filter((c) => c.nameAr.includes(q))
  }, [crops, query])

  function openCreate() {
    setEditing(undefined)
    setOpen(true)
  }

  function openEdit(crop: Crop) {
    setEditing(crop)
    setOpen(true)
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-lg text-foreground">{COPY.title}</h2>
          <p className="text-muted-foreground text-sm">{COPY.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openCreate}
        >
          <PlusIcon />
          {COPY.add}
        </Button>
      </div>

      {crops.length > 6 ? (
        <div className="relative mt-4">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
            <SearchIcon className="size-5" />
          </span>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن محصول"
            className="h-11 ps-10"
          />
        </div>
      ) : null}

      <div className="mt-4">
        {crops.length === 0 ? (
          <EmptyState
            icon={SproutIcon}
            title={COPY.emptyTitle}
            description={COPY.emptyDescription}
          />
        ) : filtered.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            لا يوجد محصول بهذا الاسم.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((crop) => (
              <button
                key={crop.id}
                type="button"
                onClick={() => openEdit(crop)}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-start"
              >
                <span
                  className={
                    crop.isActive
                      ? "truncate text-base font-medium text-foreground"
                      : "truncate text-base font-medium text-muted-foreground"
                  }
                >
                  {crop.nameAr}
                </span>
                {!crop.isActive ? (
                  <Badge variant="secondary">{COPY.inactive}</Badge>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <CropFormSheet
        open={open}
        onOpenChange={setOpen}
        mode={editing ? "edit" : "create"}
        crop={editing}
        onSaved={() => router.refresh()}
      />
    </Card>
  )
}

export default CropsManager
