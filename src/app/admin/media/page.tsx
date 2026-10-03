import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";

// Admin media upload — one image into the public `media` bucket at a path you choose (book covers, product photos).
// Source: a file from this computer, or a URL fetched server-side. Covers: articles/rep-america-great-books-<handle>-cover-amz.jpg at 750px tall.
export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ ok?: string; size?: string; error?: string }> }) {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/media")}` : "/admin/login?next=/admin/media");
  const { ok, size, error } = await searchParams;

  return (
    <div>
      <style>{`
        .ra-admin .md-form { display:grid; gap:14px; max-width:720px; }
        .ra-admin .md-form label { display:grid; gap:4px; font-size:1.3rem; color:#555; }
        .ra-admin .md-form input[type=text], .ra-admin .md-form input[type=url], .ra-admin .md-form input[type=number] { font-size:1.4rem; padding:8px 10px; border:1px solid #ccc; border-radius:6px; }
        .ra-admin .md-row { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
        .ra-admin .md-ok { word-break:break-all; }
        .ra-admin .md-ok img { display:block; max-height:300px; margin-top:10px; border:1px solid #e2e2e2; }
      `}</style>
      <h1>Media</h1>
      <p className="muted">Upload one image to Storage. Paste the URL of a cover from the affiliate listing (the hi-res <code>landingImage</code>) or pick a file. Covers go to <code>articles/rep-america-great-books-&lt;handle&gt;-cover-amz.jpg</code> at 750px tall.</p>
      {error ? <div className="notice notice--error">{error}</div> : null}
      {ok ? (
        <div className="notice md-ok">Uploaded · {size} · <a href={ok} target="_blank" rel="noreferrer">{ok}</a><img src={ok} alt="" /></div>
      ) : null}
      <form className="md-form" method="post" action="/admin/media/upload" encType="multipart/form-data">
        <label>Path in the media bucket
          <input type="text" name="path" required placeholder="articles/rep-america-great-books-the-handle-cover-amz.jpg" />
        </label>
        <label>Source URL (fetched by the server)
          <input type="url" name="url" placeholder="https://m.media-amazon.com/images/I/….jpg" />
        </label>
        <label>…or a file from this computer
          <input type="file" name="file" accept="image/*" />
        </label>
        <div className="md-row">
          <label>Resize to height (px, blank = keep)
            <input type="number" name="height" defaultValue={750} min={0} />
          </label>
          <label>JPEG quality
            <input type="number" name="quality" defaultValue={85} min={40} max={95} />
          </label>
        </div>
        <div><button className="btn" type="submit">Upload</button></div>
      </form>
    </div>
  );
}
