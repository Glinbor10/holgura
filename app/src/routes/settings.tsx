import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Alert, Box, Button, ButtonBase, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useFetcher, useRevalidator, type ActionFunctionArgs } from 'react-router-dom';
import { Group, GroupRow } from '../components/Group';
import { parseBackup, serializeBackup } from '../data/backup';
import { errorMessage } from '../data/errors';
import {
  addCategory,
  archiveCategory,
  renameCategory,
  setPayrollLine,
  setPayrollTemplate,
} from '../data/mutations';
import { mutate, replaceData } from '../data/store';
import { centsToInput, parseEuros } from '../domain/money';
import type { Cents, PayrollTemplate } from '../domain/types';
import { useRootData } from './root';
import { CategoryBadge } from './shared';

export const settingsAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get('intent'));
  const id = String(form.get('id'));
  const name = String(form.get('name') ?? '').trim();
  try {
    if (intent === 'category-add' && name) {
      await mutate((data) => addCategory(data, name));
    } else if (intent === 'category-rename' && name) {
      await mutate((data) => renameCategory(data, id, name));
    } else if (intent === 'category-archive') {
      await mutate((data) => archiveCategory(data, id));
    } else if (intent === 'payroll-amount') {
      const text = String(form.get('amount') ?? '').trim();
      const amountCents = text === '' ? undefined : parseEuros(text);
      if (amountCents === null) {
        return { error: 'Escribe un importe válido para la nómina.' };
      }
      await mutate((data) => setPayrollTemplate(data, { ...data.payrollTemplate, amountCents }));
    } else if (intent === 'payroll-funds-next') {
      await mutate((data) => setPayrollTemplate(data, { ...data.payrollTemplate, fundsNextMonth: form.get('value') === 'true' }));
    } else if (intent === 'destination-payroll') {
      const text = String(form.get('amount') ?? '').trim();
      const amountCents = text === '' ? 0 : parseEuros(text);
      if (amountCents === null) {
        return { error: 'Escribe un importe válido para el destino.' };
      }
      await mutate((data) => setPayrollLine(data, id, amountCents));
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { error: undefined };
};

const downloadInBrowser = (fileName: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const LinkRow = ({ to, title, detail }: { to: string; title: string; detail: string }) => (
  <ButtonBase component={Link} to={to} viewTransition sx={{ width: '100%', justifyContent: 'space-between', textAlign: 'left', px: 2.5, py: 1.75, minHeight: 64 }}>
    <Box>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {detail}
      </Typography>
    </Box>
    <ChevronRightIcon sx={{ color: 'text.secondary' }} />
  </ButtonBase>
);

const NameInput = ({ value, onCommit, label }: { value: string; onCommit: (name: string) => void; label: string }) => (
  <TextField
    variant="standard"
    defaultValue={value}
    fullWidth
    onBlur={(event) => (event.target.value.trim() !== '' && event.target.value.trim() !== value ? onCommit(event.target.value.trim()) : undefined)}
    slotProps={{ htmlInput: { 'aria-label': label }, input: { disableUnderline: true, sx: { fontWeight: 700, fontSize: '1rem' } } }}
  />
);

const payrollLineCents = (template: PayrollTemplate, destinationId: string): Cents =>
  template.lines.find((line) => line.destinationId === destinationId)?.amountCents ?? 0;

const AmountField = ({ cents, label, placeholder, onCommit }: { cents: Cents; label: string; placeholder: string; onCommit: (amount: string) => void }) => (
  <TextField
    hiddenLabel
    size="small"
    placeholder={placeholder}
    defaultValue={centsToInput(cents)}
    onBlur={(event) => (event.target.value.trim() !== centsToInput(cents) ? onCommit(event.target.value) : undefined)}
    sx={{ width: 120 }}
    slotProps={{
      htmlInput: { inputMode: 'decimal', 'aria-label': label, style: { textAlign: 'right' } },
      input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
    }}
  />
);

export const SettingsScreen = () => {
  const { data, today } = useRootData();
  const fetcher = useFetcher<{ error?: string }>();
  const revalidator = useRevalidator();
  const [backupMessage, setBackupMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const savingsId = data.destinations.find((destination) => destination.kind === 'SAVINGS' && !destination.archived)?.id;
  const categories = data.categories.filter((category) => !category.archived);

  const submit = (values: Record<string, string>) => fetcher.submit(values, { method: 'post' });
  const confirmArchive = (intent: string, id: string, name: string) => {
    if (window.confirm(`¿Archivar "${name}"? Sus movimientos antiguos se conservan.`)) {
      submit({ intent, id });
    }
  };

  const exportBackup = async () => {
    const fileName = `holgura-${today}.json`;
    const text = serializeBackup(data, today);
    try {
      if (Capacitor.isNativePlatform()) {
        const written = await Filesystem.writeFile({ path: fileName, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: fileName, files: [written.uri] });
      } else {
        downloadInBrowser(fileName, text);
      }
      await mutate((current) => ({ ...current, lastExportAt: today }));
      revalidator.revalidate();
      setBackupMessage({ severity: 'success', text: 'Copia exportada.' });
    } catch {
      setBackupMessage({ severity: 'error', text: 'No se pudo exportar la copia. Inténtalo de nuevo.' });
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const result = parseBackup(await file.text());
    if (!result.ok) {
      const reasons = {
        INVALID_JSON: 'El fichero no es un JSON válido.',
        INVALID_FORMAT: 'El fichero no tiene el formato de una copia de Holgura.',
        UNSUPPORTED_VERSION: 'La copia es de una versión más nueva: actualiza la app.',
      };
      setBackupMessage({ severity: 'error', text: `${reasons[result.error]} Tus datos no se han tocado.` });
      return;
    }
    if (!window.confirm('Se reemplazarán TODOS los datos actuales por los de la copia. ¿Continuar?')) {
      return;
    }
    await replaceData(result.data);
    revalidator.revalidate();
    setBackupMessage({ severity: 'success', text: 'Copia importada.' });
  };

  return (
    <Stack spacing={3.5}>
      <Typography variant="h5">Configuración</Typography>
      {fetcher.data?.error ? <Alert severity="error">{fetcher.data.error}</Alert> : null}

      <Group>
        <LinkRow to="/recurring" title="Gastos fijos" detail="Alquiler, suscripciones y pagos que se repiten" />
        <LinkRow to="/close" title="Cierre de mes" detail="Decide qué pasa con lo que sobra o falta" />
      </Group>

      <Box>
        <Typography variant="h6">Tu nómina</Typography>
        <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Se usa al pulsar "Ha llegado la nómina" en Inicio.</Typography>
        <Group>
          <GroupRow>
            <Typography sx={{ flex: 1, fontWeight: 700 }}>Importe habitual</Typography>
            <AmountField
              key={data.payrollTemplate.amountCents ?? 0}
              label="Importe habitual de la nómina"
              cents={data.payrollTemplate.amountCents ?? 0}
              placeholder="Opcional"
              onCommit={(amount) => submit({ intent: 'payroll-amount', amount })}
            />
          </GroupRow>
          {savingsId === undefined ? null : (
            <GroupRow>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>Apartar para ahorro</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  De cada nómina. El resto es para gastar.
                </Typography>
              </Box>
              <AmountField
                key={payrollLineCents(data.payrollTemplate, savingsId)}
                label="Cuánto ahorrar de cada nómina"
                cents={payrollLineCents(data.payrollTemplate, savingsId)}
                placeholder="0"
                onCommit={(amount) => submit({ intent: 'destination-payroll', id: savingsId, amount })}
              />
            </GroupRow>
          )}
          <GroupRow>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>Financia el mes siguiente</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Para quien cobra a final de mes
              </Typography>
            </Box>
            <Switch
              checked={data.payrollTemplate.fundsNextMonth}
              onChange={(event) => submit({ intent: 'payroll-funds-next', value: String(event.target.checked) })}
              slotProps={{ input: { 'aria-label': 'Financia el mes siguiente' } }}
            />
          </GroupRow>
        </Group>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Categorías
        </Typography>
        <Group>
          {categories.map((category) => (
            <GroupRow key={`${category.id}-${category.name}`}>
              <CategoryBadge name={category.name} size={40} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <NameInput
                  value={category.name}
                  label={`Nombre de la categoría ${category.name}`}
                  onCommit={(name) => submit({ intent: 'category-rename', id: category.id, name })}
                />
              </Box>
              <IconButton aria-label={`Archivar ${category.name}`} size="small" onClick={() => confirmArchive('category-archive', category.id, category.name)}>
                <ArchiveOutlinedIcon fontSize="small" />
              </IconButton>
            </GroupRow>
          ))}
          <fetcher.Form method="post" key={categories.length}>
            <GroupRow>
              <input type="hidden" name="intent" value="category-add" />
              <TextField name="name" variant="standard" fullWidth placeholder="Nueva categoría" slotProps={{ input: { disableUnderline: true } }} />
              <Button type="submit">Añadir</Button>
            </GroupRow>
          </fetcher.Form>
        </Group>
      </Box>

      <Box>
        <Typography variant="h6">Copia de seguridad</Typography>
        <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
          Tus datos están solo dentro de esta app: si la desinstalas o borras sus datos, se pierden. Última copia: {data.lastExportAt ?? 'nunca'}. Guárdala en Drive, en el correo o donde quieras.
        </Typography>
        {backupMessage ? (
          <Alert severity={backupMessage.severity} sx={{ mb: 1.5 }}>
            {backupMessage.text}
          </Alert>
        ) : null}
        <Stack spacing={1.5}>
          <Button variant="contained" size="large" onClick={exportBackup}>
            Exportar copia
          </Button>
          <Button variant="outlined" color="inherit" size="large" component="label" sx={{ borderColor: 'divider' }}>
            Importar copia
            <input hidden type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} />
          </Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6">Privacidad</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Holgura no tiene permiso de internet ni cuentas. Tus datos solo están en este móvil y Android no los copia a ningún sitio: las copias las haces tú.
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', pb: 1 }}>
        Holgura. Uso no comercial (PolyForm Noncommercial 1.0.0).
      </Typography>
    </Stack>
  );
};
