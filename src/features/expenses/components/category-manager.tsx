"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/shared"

import type { CategoryOption } from "../types"
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
} from "../server/expenses.actions"

export type CategoryManagerProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  categories: CategoryOption[]
}

export function CategoryManager({
  open,
  onOpenChange,
  categories,
}: CategoryManagerProps) {
  const router = useRouter()
  const [newName, setNewName] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")

  async function handleAdd() {
    const nameAr = newName.trim()
    if (!nameAr) return
    setPending(true)
    try {
      const res = await createCategoryAction({ nameAr })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      setNewName("")
      toast.success("تمت إضافة التصنيف")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  function startEdit(cat: CategoryOption) {
    setEditingId(cat.id)
    setEditName(cat.nameAr)
  }

  async function handleRename(id: string) {
    const nameAr = editName.trim()
    if (!nameAr) return
    setPending(true)
    try {
      const res = await renameCategoryAction({ id, nameAr })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      setEditingId(null)
      toast.success("تم تعديل التصنيف")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteCategoryAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success("تم حذف التصنيف")
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">إدارة التصنيفات</SheetTitle>
          <SheetDescription>
            أضف تصنيفات خاصة بك أو عدّل أسماءها. التصنيفات الافتراضية ثابتة.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {/* Add form */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-category">اسم التصنيف</Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-category"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: أسمدة"
                disabled={pending}
              />
              <Button
                type="button"
                className="h-12 shrink-0"
                disabled={pending || newName.trim() === ""}
                onClick={handleAdd}
              >
                إضافة
              </Button>
            </div>
          </div>

          {/* List */}
          <ul className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id
              return (
                <li
                  key={cat.id}
                  className="flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={pending}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="حفظ"
                        disabled={pending || editName.trim() === ""}
                        onClick={() => handleRename(cat.id)}
                      >
                        <CheckIcon className="text-income" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="إلغاء"
                        onClick={() => setEditingId(null)}
                      >
                        <XIcon />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-base text-foreground">
                        {cat.nameAr}
                      </span>
                      {cat.isSystem ? (
                        <Badge variant="secondary">افتراضي</Badge>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="تعديل"
                            onClick={() => startEdit(cat)}
                          >
                            <PencilIcon />
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="حذف"
                              >
                                <Trash2Icon className="text-expense" />
                              </Button>
                            }
                            title="حذف التصنيف؟"
                            description={`سيتم حذف تصنيف "${cat.nameAr}".`}
                            confirmLabel="حذف"
                            destructive
                            onConfirm={() => handleDelete(cat.id)}
                          />
                        </>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CategoryManager
