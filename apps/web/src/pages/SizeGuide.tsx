import { Link } from 'react-router-dom';

const SIZE_GUIDE = [
  { size: 'XS', bust: '30–31', underBust: '26–27', waist: '24–25' },
  { size: 'S', bust: '32–33', underBust: '28–29', waist: '26–27' },
  { size: 'M', bust: '34–35', underBust: '30–31', waist: '28–29' },
  { size: 'L', bust: '36–37', underBust: '32–33', waist: '30–32' },
  { size: 'XL', bust: '38–40', underBust: '34–36', waist: '33–35' },
  { size: '2XL', bust: '41–43', underBust: '37–39', waist: '36–38' },
];

function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Blouse fitting</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Size guide</h1>
        <p className="mt-3 text-gray-600">
          Blouse sizes are cut to bust measurement. Measurements below are in inches. When in doubt, go one size up —
          a blouse can always be taken in, but not let out.
        </p>
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Bust (in)</th>
              <th className="px-4 py-3">Under bust (in)</th>
              <th className="px-4 py-3">Waist (in)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((row) => (
              <tr key={row.size} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold text-gray-900">{row.size}</td>
                <td className="px-4 py-3">{row.bust}</td>
                <td className="px-4 py-3">{row.underBust}</td>
                <td className="px-4 py-3">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">How to measure</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Measure over a fitted blouse or bra, keeping the tape snug but not tight.</li>
            <li>Bust: around the fullest part of your chest.</li>
            <li>Under bust: just below the bust, around the ribcage.</li>
            <li>Waist: at your natural waistline, the narrowest point.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Better fit options</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>For custom-fitting designs, add your exact measurements at checkout — we stitch to them.</li>
            <li>Share style preferences like neckline and sleeve in the customizer.</li>
            <li>Not sure? WhatsApp us your measurements and we will recommend a size.</li>
            <li>Ready-made blouses can be altered locally for a small tailoring charge.</li>
          </ul>
        </div>
      </section>

      <Link to="/products" className="mt-8 inline-block text-sm font-semibold text-pink-600">Browse the collection →</Link>
    </div>
  );
}

export default SizeGuidePage;