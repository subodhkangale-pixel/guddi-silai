function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <section className="text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
          Beautiful Blouses, <span className="text-pink-600">Tailored for You</span>
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Discover ready-made blouses, customize your perfect fit, or showcase your designs.
          Traditional craftsmanship meets modern convenience.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/products"
            className="bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-pink-700 transition-colors"
          >
            Explore Collection
          </a>
          <a
            href="/products"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Customize Now
          </a>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <article className="text-center p-6">
          <div className="mx-auto h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Ready Made</h3>
          <p className="mt-2 text-gray-600">Browse our curated collection of ready-to-wear blouses in various styles and sizes.</p>
        </article>

        <article className="text-center p-6">
          <div className="mx-auto h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Customize</h3>
          <p className="mt-2 text-gray-600">Design your perfect blouse with custom measurements, fabrics, and design details.</p>
        </article>

        <article className="text-center p-6">
          <div className="mx-auto h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Showcase</h3>
          <p className="mt-2 text-gray-600">Showcase your unique designs and get featured in our community gallery.</p>
        </article>
      </section>
    </div>
  );
}

export default Home;