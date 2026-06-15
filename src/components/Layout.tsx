import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const ONGLETS = [
  { to: '/', label: 'Accueil', icone: '🏠', exact: true },
  { to: '/cave', label: 'Ma cave', icone: '🍇', exact: false },
  { to: '/inventaire', label: 'Inventaire', icone: '📊', exact: false },
  { to: '/reglages', label: 'Réglages', icone: '⚙️', exact: false },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // On masque le « + » sur le formulaire pour éviter le doublon.
  const masquerFab = pathname.includes('/nouveau') || pathname.endsWith('/edit');

  return (
    <div className="mx-auto flex min-h-full max-w-screen-sm flex-col">
      <main className="flex-1 px-4 pb-28 safe-top">
        <Outlet />
      </main>

      {!masquerFab && (
        <button
          type="button"
          aria-label="Ajouter un vin"
          onClick={() => navigate('/vin/nouveau')}
          className="fixed right-4 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-wine-700 text-3xl text-white shadow-lg active:scale-95 active:bg-wine-800 sm:right-[calc(50%-15rem)]"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          +
        </button>
      )}

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-sm">
          {ONGLETS.map((o) => (
            <NavLink
              key={o.to}
              to={o.to}
              end={o.exact}
              className={({ isActive }) =>
                `flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs ${
                  isActive ? 'text-wine-700' : 'text-stone-500'
                }`
              }
            >
              <span className="text-xl">{o.icone}</span>
              {o.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
