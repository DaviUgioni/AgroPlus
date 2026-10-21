// constants/mapa.ts
import { Platform } from 'react-native';

/**
 * O mapa do Android (Google Maps) só abre em build instalado se a chave da API estiver no
 * app.json (android.config.googleMaps.apiKey). Sem ela o app fecha ao abrir o mapa.
 * No Expo Go (modo de desenvolvimento) e no iOS o mapa funciona sem essa chave.
 * Depois de configurar a chave, troque a constante abaixo para `true`.
 */
const CHAVE_DO_MAPA_CONFIGURADA = false;

export const MAPA_DISPONIVEL = Platform.OS !== 'android' || __DEV__ || CHAVE_DO_MAPA_CONFIGURADA;
