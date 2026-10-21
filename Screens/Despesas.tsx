import ComPropriedade from '../Components/ComPropriedade';
import DespesasLista from './DespesasLista';

// Aba Despesas: escolhe a propriedade (chips) e mostra as despesas dela na mesma tela.
export default function Despesas() {
  return <ComPropriedade titulo="Despesas">{(propriedade) => <DespesasLista embutido propriedadeId={propriedade.id!} />}</ComPropriedade>;
}
