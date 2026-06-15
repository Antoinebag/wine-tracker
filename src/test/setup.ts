// IndexedDB simulé pour les tests (Dexie tourne alors en mémoire).
import 'fake-indexeddb/auto';

// Active le support de act(...) pour les tests de rendu React.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
