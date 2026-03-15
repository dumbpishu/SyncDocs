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

  const displayName = fullName.trim() || user?.fullName || user?.username || "Workspace member";
  const initials = (username || user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-370 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[36px] border border-[#d8dee9] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_28px_64px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/dashboard"
              className="inline-flex rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-sm font-medium text-[#667085] shadow-[0_6px_12px_rgba(15,23,42,0.03)] transition hover:text-[#101828]"
            >
              Back
            </Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">Manage account</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#101828] sm:text-5xl">
              Personal settings, profile, and session controls.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#667085]">
              Keep your profile current, update your avatar, and manage the account attached to your shared
              document workspace.
            </p>
          </div>
        </div>
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-4xl border border-[#dde3ec] bg-white p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#101828]">Profile details</p>
              <p className="mt-1 text-sm text-[#667085]">Update the information shown across your workspace.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="flex flex-col gap-5 rounded-3xl border border-[#e8edf3] bg-[#fcfcfd] p-5 sm:flex-row sm:items-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={username || "Avatar"}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dbeafe,#e0f2fe)] text-3xl font-semibold text-[#274690] shadow-[0_12px_28px_rgba(39,70,144,0.14)]">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-[#101828]">{displayName}</p>
                <p className="mt-1 text-sm text-[#667085]">@{username || user?.username || "username"}</p>
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
                  className="mt-4 cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#344054]">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                  placeholder="Your full name"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[#344054]">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                  placeholder="username"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-[#e4e7ec] bg-[#fcfcfd] px-5 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[#344054]">Avatar URL</p>
              </div>
              <p className="mt-3 break-all text-sm leading-7 text-[#667085]">{avatar || "No avatar uploaded"}</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#eef2f6] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#667085]">Save after making changes to update your profile.</p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(17,24,39,0.16)] transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-4xl border border-[#f1d4da] bg-[linear-gradient(180deg,#fffafa_0%,#fff6f7_100%)] p-6 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[#912018]">Danger zone</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#7a271a]">Delete account</h2>
          <p className="mt-4 text-sm leading-7 text-[#b54708]">
            This permanently removes your account, owned documents, and collaborator access from shared workspaces.
          </p>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-6 w-full cursor-pointer rounded-xl border border-[#f0d5dd] bg-white px-4 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f3] disabled:cursor-not-allowed disabled:opacity-60"
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
