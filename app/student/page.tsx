import Link from 'next/link';
export default function StudentDashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">Hoş Geldin, Ahmet! 👋</h1>
        <p className="text-slate-600 mt-2 text-lg">Bugün ne kadar ilerleme kaydettin? Hadi başlayalım.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm">Bu Ay Çözülen Soru</p>
          <p className="text-5xl font-bold text-blue-600 mt-4">1.856</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm">Ortalama Net</p>
          <p className="text-5xl font-bold text-emerald-600 mt-4">74.2</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm">Toplam Çalışma Saati</p>
          <p className="text-5xl font-bold text-amber-600 mt-4">62s</p>
        </div>
      </div>

      {/* Hızlı Butonlar */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/student/daily"
            className="block bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                📝
              </div>
              <div>
                <p className="text-xl font-semibold group-hover:text-blue-600 transition-colors">Günlük Çalışma Gir</p>
                <p className="text-slate-500 mt-1">Bugün çözdüğün soruları kaydet</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/student/exam"
            className="block bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                📊
              </div>
              <div>
                <p className="text-xl font-semibold group-hover:text-blue-600 transition-colors">Deneme Sonucu Gir</p>
                <p className="text-slate-500 mt-1">Son deneme performansını kaydet</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}