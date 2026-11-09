import { useNavigate } from 'react-router';

// material-ui
import Button from '@mui/material/Button';

// assets
import { Add } from 'iconsax-reactjs';

import { useEngine, useText } from '../context';
import { newLabel, newRecordPath } from '../formValues';

/** "Adicionar" (ou `label.new`) da lista (só com `capabilities.create`): abre o formulário novo levando o preset ativo (os `defaults` dele) e diz a filial. */
export default function AddButton({
  entity,
  preset,
  branch,
  onClick
}: {
  entity: string;
  preset?: string;
  branch?: string;
  /** No lugar de abrir a página do novo (formulário num diálogo sobre a lista). */
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  const text = useText();
  const { def, capabilities } = useEngine().entities[entity];
  if (!capabilities.create) return null;
  return (
    <Button variant="contained" startIcon={<Add />} onClick={onClick ?? (() => navigate(newRecordPath(entity, preset)))}>
      {newLabel(def, text)}
      {branch && ` em ${branch}`}
    </Button>
  );
}
