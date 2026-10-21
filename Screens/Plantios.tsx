import ComPropriedade from '../Components/ComPropriedade';
import PlantiosLista from './PlantiosLista';

// Aba Plantios: escolhe a propriedade (chips) e mostra os plantios dela na mesma tela.
export default function Plantios() {
  return <ComPropriedade titulo="Plantios">{(propriedade) => <PlantiosLista embutido propriedadeId={propriedade.id!} />}</ComPropriedade>;
}
