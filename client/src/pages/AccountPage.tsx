import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteCurrentUser, updateCurrentUser, uploadCurrentUserAvatar } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/api";

export default function AccountPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, markAuthenticated, clearSession } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setUsername(user?.username ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user]);

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setError("");
      setNotice("");
      const imageData = await readFileAsDataUrl(file);
      const data = await uploadCurrentUserAvatar(imageData);

      if (data?.user) {
        markAuthenticated(data.user);
        setAvatar(data.user.avatar ?? "");
      }

      setNotice("Avatar uploaded.");
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Unable to upload avatar."));
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setNotice("");

      const data = await updateCurrentUser({
        fullName: fullName.trim() || undefined,
        username: username.trim().toLowerCase() || undefined,
        avatar: avatar.trim(),
      });

      if (data?.user) {
        markAuthenticated(data.user);
        setNotice("Profile updated.");
      }
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to update account."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete your account? This removes your documents and collaborator access.",
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError("");
      await deleteCurrentUser();
      clearSession();
      navigate("/", { replace: true });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete account."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[#dbe3ee] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#edf4ff_100%)] p-7 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <Link to="/dashboard" className="text-sm font-medium text-[#667085] transition hover:text-[#101828]">
          Back
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828]">Account</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#667085]">
          Manage your profile information, avatar, and account settings from one place.
        </p>
      </section>

      {(error || notice) && (
        <div className="grid gap-3">
          {error ? (
            <div className="rounded-2xl border border-[#f0d5dd] bg-[#fff7f8] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-[#cce8d8] bg-[#f2fbf5] px-4 py-3 text-sm text-[#067647]">
              {notice}
            </div>
          ) : null}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[30px] border border-[#dde3ec] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
          <p className="text-sm font-semibold text-[#101828]">Profile</p>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col items-start gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={username || "Avatar"}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_14px_34px_rgba(15,23,42,0.14)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dbeafe,#e0f2fe)] text-3xl font-semibold text-[#274690] shadow-[0_14px_34px_rgba(39,70,144,0.16)]">
                  {(username || user?.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-60"
              >
                {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
              </button>
              <p className="max-w-[220px] text-xs leading-6 text-[#98a2b3]">PNG or JPG recommended.</p>
            </div>

            <div className="grid flex-1 gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#344054]">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#344054]">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                />
              </label>

              <div className="rounded-2xl border border-[#e4e7ec] bg-[#fcfcfd] px-4 py-4">
                <p className="text-sm font-medium text-[#344054]">Avatar URL</p>
                <p className="mt-2 break-all text-sm leading-6 text-[#667085]">{avatar || "No avatar uploaded"}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[30px] border border-[#f1d4da] bg-[linear-gradient(180deg,#fffafa_0%,#fff6f7_100%)] p-6 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[#912018]">Delete account</p>
          <p className="mt-3 text-sm leading-7 text-[#b54708]">
            This action removes your account, owned documents, and collaborator access.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-6 rounded-xl border border-[#f0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f3] disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </button>
        </aside>
      </section>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}
