import { createContext, useContext } from 'react';

// Modo claro/escuro do app. O estado fica no App; as telas só leem e pedem a troca.
export const ModoContext = createContext<{ escuro: boolean; alternar: (escuro: boolean) => void }>({
  escuro: false,
  alternar: () => {},
});

export const useModo = () => useContext(ModoContext);
