export default function AuthLayout({ children }: any) {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-8 w-105">

        <h1 className="text-2xl font-bold text-center mb-6">
          SyncDocs
        </h1>

        {children}

      </div>

    </div>
  );
}
