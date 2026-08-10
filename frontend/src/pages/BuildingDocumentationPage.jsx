import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  DownloadSimpleIcon,
  FilmStripIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  VideoCameraIcon,
  XIcon,
} from "@phosphor-icons/react";
import Pagination from "../components/asset/Pagination";
import { useConfirm } from "../components/ui/confirmContext";
import { buildingDocumentationService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { hasPermission } from "../utils/permissions";

const ACCEPTED_EXTENSIONS = /\.(gif|jpe?g|png|webp|mp4|mov|webm)$/i;
const MAX_FILE_SIZE = 200 * 1024 * 1024;

const errorMessage = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || fallback;

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
};

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
  : "Belum ditentukan";

function UploadDialog({ building, open, onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [description, setDescription] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const closeDialog = () => {
    setDescription("");
    setCapturedAt("");
    setFiles([]);
    onClose();
  };

  const addFiles = (selected) => {
    const next = Array.from(selected || []);
    const valid = next.filter((file) => ACCEPTED_EXTENSIONS.test(file.name) && file.size <= MAX_FILE_SIZE);
    if (valid.length !== next.length) toast.error("Sebagian file dilewati. Gunakan foto/video yang didukung, maksimal 200 MB per file.");
    setFiles((current) => [...current, ...valid].slice(0, 20));
  };

  const submit = async () => {
    if (files.length === 0) return toast.error("Pilih minimal satu foto atau video");
    setUploading(true);
    let succeeded = 0;
    for (const file of files) {
      try {
        await buildingDocumentationService.create({
          file,
          kode3d: building.kode_3d,
          title: file.name.replace(/\.[^.]+$/, ""),
          description,
          capturedAt,
        });
        succeeded += 1;
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error, "gagal diunggah")}`);
      }
    }
    setUploading(false);
    if (succeeded > 0) {
      toast.success(`${succeeded} dokumentasi berhasil diunggah`);
      await onUploaded();
      closeDialog();
    }
  };

  if (!open || !building) return null;
  return (
    <div className="motion-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => !uploading && event.target === event.currentTarget && closeDialog()}>
      <section role="dialog" aria-modal="true" aria-labelledby="documentation-upload-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-600 to-violet-600 text-white"><UploadSimpleIcon size={19} weight="bold" /></span><div><h2 id="documentation-upload-title" className="text-sm font-black text-text-primary">Impor Foto & Video</h2><p className="mt-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">{building.kode_3d} · {building.building_name || "Tanpa nama"}</p></div></div>
          <button type="button" disabled={uploading} onClick={closeDialog} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary disabled:opacity-40" aria-label="Tutup"><XIcon size={16} weight="bold" /></button>
        </header>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[9px] font-black uppercase tracking-wide text-text-muted">Tanggal Dokumentasi</span><input type="date" value={capturedAt} onChange={(event) => setCapturedAt(event.target.value)} disabled={uploading} className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" /></label>
            <label className="block"><span className="mb-1.5 block text-[9px] font-black uppercase tracking-wide text-text-muted">Keterangan</span><input value={description} onChange={(event) => setDescription(event.target.value)} disabled={uploading} maxLength={2000} placeholder="Contoh: Kondisi fasad sisi utara" className="h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15" /></label>
          </div>
          <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }} className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 px-5 text-center transition hover:border-violet-500 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 dark:border-violet-500/40 dark:bg-violet-500/5"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white"><PlusIcon size={19} weight="bold" /></span><span className="mt-3 text-xs font-black text-violet-700 dark:text-violet-300">Pilih atau jatuhkan foto dan video</span><span className="mt-1 text-[9px] text-text-muted">JPG, PNG, WebP, GIF, MP4, MOV, WebM · maks. 200 MB/file</span></button>
          <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} className="hidden" />
          {files.length > 0 && <div className="space-y-2" aria-live="polite">{files.map((file, index) => <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-violet-600">{file.type.startsWith("video/") ? <VideoCameraIcon size={16} /> : <ImageIcon size={16} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-text-primary">{file.name}</span><span className="text-[8px] text-text-muted">{formatBytes(file.size)}</span></span><button type="button" disabled={uploading} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label={`Hapus ${file.name}`}><XIcon size={13} weight="bold" /></button></div>)}</div>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border bg-surface-secondary/60 px-5 py-4"><button type="button" disabled={uploading} onClick={closeDialog} className="h-10 rounded-xl border border-border px-4 text-xs font-bold text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50">Batal</button><button type="button" disabled={uploading || files.length === 0} onClick={submit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-black text-surface hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? <ArrowsClockwiseIcon size={15} className="animate-spin" /> : <UploadSimpleIcon size={15} weight="bold" />}Impor {files.length || ""}</button></footer>
      </section>
    </div>
  );
}

function ManageDialog({ building, canUpdate, open, onClose, onChanged }) {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!open || !building) return;
    setLoading(true);
    try {
      const response = await buildingDocumentationService.list({ kode_3d: building.kode_3d, page: 1, limit: 100 });
      setItems(response.data?.data || []);
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat dokumentasi bangunan"));
    } finally {
      setLoading(false);
    }
  }, [building, open]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const removeItem = async (item) => {
    const accepted = await confirm({ title: "Hapus dokumentasi?", message: `${item.title} akan dihapus permanen dari penyimpanan.`, confirmText: "Hapus", variant: "danger" });
    if (!accepted) return;
    setDeletingId(item.id_documentation);
    try {
      await buildingDocumentationService.remove(item.id_documentation);
      toast.success("Dokumentasi berhasil dihapus");
      await fetchItems();
      await onChanged();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menghapus dokumentasi"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!open || !building) return null;
  const photoCount = items.filter((item) => item.media_type === "photo").length;
  const videoCount = items.filter((item) => item.media_type === "video").length;
  return (
    <div className="motion-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="manage-documentation-title" className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-600 to-violet-600 text-white"><FilmStripIcon size={19} weight="duotone" /></span><div><h2 id="manage-documentation-title" className="text-sm font-black text-text-primary">Kelola Dokumentasi</h2><p className="mt-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">{building.kode_3d} · {building.building_name || "Tanpa nama"}</p></div></div><div className="flex items-center gap-2"><span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 text-[9px] font-bold text-text-muted"><ImageIcon size={13} className="text-fuchsia-500" />{photoCount} foto</span><span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 text-[9px] font-bold text-text-muted"><VideoCameraIcon size={13} className="text-violet-500" />{videoCount} video</span>{canUpdate && <button type="button" onClick={() => setUploadOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-black text-surface hover:bg-accent/90"><UploadSimpleIcon size={14} weight="bold" />Impor Media</button>}<button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary" aria-label="Tutup"><XIcon size={16} weight="bold" /></button></div></header>
        <div className="min-h-64 flex-1 overflow-y-auto p-5">{loading ? <div className="flex min-h-64 items-center justify-center"><ArrowsClockwiseIcon size={25} className="animate-spin text-accent" /></div> : items.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-secondary/50 px-6 text-center"><FilmStripIcon size={30} className="text-violet-400" /><p className="mt-3 text-xs font-black text-text-primary">Belum ada foto atau video</p><p className="mt-1 text-[9px] text-text-muted">Gunakan Impor Media untuk menambahkan dokumentasi bangunan ini.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id_documentation} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"><div className="relative aspect-video overflow-hidden bg-slate-950">{item.media_type === "video" ? <video src={item.public_url} controls preload="metadata" className="h-full w-full object-contain" aria-label={item.title} /> : <a href={item.public_url} target="_blank" rel="noreferrer"><img src={item.public_url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /></a>}</div><div className="p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[10px] font-black text-text-primary">{item.title}</h3><p className="mt-1 inline-flex items-center gap-1 text-[8px] text-text-muted"><CalendarBlankIcon size={10} />{formatDate(item.captured_at || item.created_at)} · {formatBytes(item.file_size_bytes)}</p></div><div className="flex shrink-0 gap-1"><a href={item.public_url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent hover:text-accent" aria-label={`Buka ${item.title}`}><DownloadSimpleIcon size={12} weight="bold" /></a>{canUpdate && <button type="button" disabled={deletingId === item.id_documentation} onClick={() => removeItem(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10" aria-label={`Hapus ${item.title}`}>{deletingId === item.id_documentation ? <ArrowsClockwiseIcon size={12} className="animate-spin" /> : <TrashIcon size={12} weight="bold" />}</button>}</div></div>{item.description && <p className="mt-2 line-clamp-2 text-[8px] leading-relaxed text-text-muted">{item.description}</p>}</div></article>)}</div>}</div>
      </section>
      <UploadDialog building={building} open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={async () => { await fetchItems(); await onChanged(); }} />
    </div>
  );
}

export default function BuildingDocumentationPage() {
  const userRole = useAuthStore((state) => state.user?.role || "");
  const canUpdate = hasPermission(userRole, "kelola3d", "update");
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await buildingDocumentationService.buildings({ page, limit, search });
      setBuildings(response.data?.data || []);
      setPagination(response.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat data bangunan"));
    } finally {
      setLoading(false);
    }
  }, [limit, page, search]);

  useEffect(() => { void fetchBuildings(); }, [fetchBuildings]);

  return (
    <div className="min-h-full bg-surface-secondary p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="admin-page-header"><div className="admin-page-header__identity"><span className="admin-page-header__icon bg-linear-to-br from-fuchsia-600 to-violet-600 text-white"><FilmStripIcon size={21} weight="duotone" /></span><div className="min-w-0"><h1 className="admin-page-header__title">Dokumentasi Bangunan</h1><p className="mt-1 text-[10px] text-text-muted">Kelola foto dan video untuk seluruh data bangunan.</p></div></div><div className="admin-page-header__actions"><button type="button" onClick={fetchBuildings} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"><ArrowsClockwiseIcon size={15} weight="bold" className={loading ? "animate-spin" : ""} />Refresh</button></div></header>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-4"><label className="relative block max-w-lg"><span className="sr-only">Cari bangunan</span><MagnifyingGlassIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cari kode atau nama bangunan..." className="h-10 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-3 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15" /></label></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead><tr className="border-b border-border bg-surface-secondary/70"><th className="w-16 px-4 py-3 text-left text-[9px] font-black uppercase tracking-wide text-text-muted">No.</th><th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wide text-text-muted">Kode Bangunan</th><th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wide text-text-muted">Nama Bangunan</th><th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wide text-text-muted">Kode Bidang 2D</th><th className="w-28 px-4 py-3 text-center text-[9px] font-black uppercase tracking-wide text-text-muted">Foto</th><th className="w-28 px-4 py-3 text-center text-[9px] font-black uppercase tracking-wide text-text-muted">Video</th><th className="w-32 px-4 py-3 text-center text-[9px] font-black uppercase tracking-wide text-text-muted">Total Media</th><th className="sticky right-0 w-32 border-l border-border bg-surface-secondary px-4 py-3 text-right text-[9px] font-black uppercase tracking-wide text-text-muted">Aksi</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={8} className="h-60 text-center"><ArrowsClockwiseIcon size={25} className="mx-auto animate-spin text-accent" aria-label="Memuat data bangunan" /></td></tr> : buildings.length === 0 ? <tr><td colSpan={8} className="h-60 text-center"><BuildingsIcon size={30} className="mx-auto text-text-muted" /><p className="mt-3 text-xs font-black text-text-primary">Data bangunan tidak ditemukan</p></td></tr> : buildings.map((building, index) => <tr key={building.kode_3d} className="group border-b border-border/70 transition last:border-b-0 hover:bg-surface-secondary/60"><td className="px-4 py-3 text-[10px] font-bold text-text-muted">{(page - 1) * limit + index + 1}</td><td className="px-4 py-3"><span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1.5 font-mono text-[10px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{building.kode_3d}</span></td><td className="px-4 py-3 text-xs font-bold text-text-primary">{building.building_name || <span className="font-normal italic text-text-muted">Belum diisi</span>}</td><td className="px-4 py-3 font-mono text-[10px] text-text-secondary">{building.kode_2d || "-"}</td><td className="px-4 py-3 text-center"><span className="inline-flex min-w-14 items-center justify-center gap-1.5 rounded-lg bg-fuchsia-50 px-2.5 py-1.5 text-[10px] font-black text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300"><ImageIcon size={13} weight="duotone" />{building.photo_count}</span></td><td className="px-4 py-3 text-center"><span className="inline-flex min-w-14 items-center justify-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[10px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><VideoCameraIcon size={13} weight="duotone" />{building.video_count}</span></td><td className="px-4 py-3 text-center text-xs font-black text-text-primary">{building.documentation_count}</td><td className="sticky right-0 border-l border-border bg-surface px-4 py-3 text-right group-hover:bg-surface-secondary"><button type="button" onClick={() => setSelectedBuilding(building)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-[9px] font-black text-surface hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent">Kelola<ArrowRightIcon size={12} weight="bold" /></button></td></tr>)}</tbody>
            </table>
          </div>
          <Pagination pagination={pagination} currentPage={page} itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={(value) => { setLimit(value); setPage(1); }} pageSizeOptions={[10, 25, 50, 100]} embedded itemLabel="bangunan" />
        </section>
      </div>
      <ManageDialog building={selectedBuilding} canUpdate={canUpdate} open={Boolean(selectedBuilding)} onClose={() => setSelectedBuilding(null)} onChanged={fetchBuildings} />
    </div>
  );
}
