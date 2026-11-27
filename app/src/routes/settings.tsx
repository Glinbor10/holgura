import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Alert, Box, Button, ButtonBase, IconButton, InputAdornment, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useFetcher, useRevalidator, type ActionFunctionArgs } from 'react-router-dom';
import { Group, GroupRow } from '../components/Group';
import { parseBackup, serializeBackup } from '../data/backup';
import { errorMessage } from '../data/errors';
import {
  addCategory,
  addDestination,
  archiveCategory,
  archiveDestination,
  renameCategory,
  renameDestination,
  setPayrollTemplate,
} from '../data/mutations';
import { mutate, replaceData } from '../data/store';
import { destinationBalance } from '../domain/balances';
import { centsToInput, formatEuros, parseEuros } from '../domain/money';
import type { Allocation } from '../domain/types';
import { useRootData } from './root';
import { CategoryBadge } from './shared';

export const settingsAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get('intent'));
  const id = String(form.get('id'));
  const name = String(form.get('name') ?? '').trim();
  try {
    if (intent === 'destination-add' && name) {
      await mutate((data) => addDestination(data, { name, kind: 'SAVINGS' }));
    } else if (intent === 'destination-rename' && name) {
      await mutate((data) => renameDestination(data, id, name));
    } else if (intent === 'destination-archive') {
      await mutate((data) => archiveDestination(data, id));
    } else if (intent === 'category-add' && name) {
      await mutate((data) => addCategory(data, name));
    } else if (intent === 'category-rename' && name) {
      await mutate((data) => renameCategory(data, id, name));
    } else if (intent === 'category-archive') {
      await mutate((data) => archiveCategory(data, id));
    } else if (intent === 'template-save') {
      const lines: Allocation[] = [];
      for (const [key, value] of form.entries()) {
        if (key.startsWith('line-') && String(value).trim() !== '') {
          const amountCents = parseEuros(String(value));
          if (amountCents === null) {
            return { error: 'Revisa los importes del reparto de la nómina.' };
          }
          lines.push({ destinationId: key.slice('line-'.length), amountCents });
        }
      }
      await mutate((data) =>
        setPayrollTemplate(data, {
          lines,
          remainderDestinationId: String(form.get('remainder')),
          fundsNextMonth: form.get('fundsNextMonth') === 'on',
        }),
      );
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

export const SettingsScreen = () => {
  const { data, today } = useRootData();
  const fetcher = useFetcher<{ error?: string }>();
  const revalidator = useRevalidator();
  const [backupMessage, setBackupMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const destinations = data.destinations.filter((destination) => !destination.archived);
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
      <Typography variant="h5">Ajustes</Typography>
      {fetcher.data?.error ? <Alert severity="error">{fetcher.data.error}</Alert> : null}

      <Group>
        <LinkRow to="/recurring" title="Gastos fijos" detail="Alquiler, suscripciones y pagos que se repiten" />
        <LinkRow to="/close" title="Cierre de mes" detail="Decide qué pasa con lo que sobra o falta" />
      </Group>

      <Box>
        <Typography variant="h6">Reparto de la nómina</Typography>
        <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
          Cuánto va a cada destino cuando cobras. Lo que no asignes va al destino que elijas.
        </Typography>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="template-save" />
          <Group>
            {destinations.map((destination) => (
              <GroupRow key={destination.id}>
                <Typography sx={{ flex: 1, fontWeight: 700 }}>{destination.name}</Typography>
                <TextField
                  name={`line-${destination.id}`}
                  size="small"
                  placeholder="Resto"
                  defaultValue={centsToInput(data.payrollTemplate.lines.find((line) => line.destinationId === destination.id)?.amountCents ?? 0)}
                  sx={{ width: 140 }}
                  slotProps={{
                    htmlInput: { inputMode: 'decimal', 'aria-label': `Importe fijo para ${destination.name}`, style: { textAlign: 'right' } },
                    input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                  }}
                />
              </GroupRow>
            ))}
            <GroupRow>
              <Typography sx={{ flex: 1, fontWeight: 700 }}>El resto va a</Typography>
              <TextField select name="remainder" size="small" defaultValue={data.payrollTemplate.remainderDestinationId} sx={{ minWidth: 140 }}>
                {destinations.map((destination) => (
                  <MenuItem key={destination.id} value={destination.id}>
                    {destination.name}
                  </MenuItem>
                ))}
              </TextField>
            </GroupRow>
            <GroupRow>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>Financia el mes siguiente</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Para quien cobra a final de mes
                </Typography>
              </Box>
              <Switch name="fundsNextMonth" defaultChecked={data.payrollTemplate.fundsNextMonth} />
            </GroupRow>
          </Group>
          <Button type="submit" variant="contained" sx={{ mt: 1.5 }}>
            Guardar reparto
          </Button>
        </fetcher.Form>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Destinos
        </Typography>
        <Group>
          {destinations.map((destination) => (
            <GroupRow key={`${destination.id}-${destination.name}`}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <NameInput
                  value={destination.name}
                  label={`Nombre del destino ${destination.name}`}
                  onCommit={(name) => submit({ intent: 'destination-rename', id: destination.id, name })}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {destination.kind === 'SPENDING' ? 'Para gastar' : 'Ahorro'}, {formatEuros(destinationBalance(destination, data.transactions))}
                </Typography>
              </Box>
              {destination.kind === 'SPENDING' ? null : (
                <IconButton aria-label={`Archivar ${destination.name}`} size="small" onClick={() => confirmArchive('destination-archive', destination.id, destination.name)}>
                  <ArchiveOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </GroupRow>
          ))}
          <fetcher.Form method="post" key={destinations.length}>
            <GroupRow>
              <input type="hidden" name="intent" value="destination-add" />
              <TextField name="name" variant="standard" fullWidth placeholder="Nuevo destino de ahorro" slotProps={{ input: { disableUnderline: true } }} />
              <Button type="submit">Añadir</Button>
            </GroupRow>
          </fetcher.Form>
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
          Tus datos solo están en este móvil. Última copia: {data.lastExportAt ?? 'nunca'}. Guárdala en Drive, en el correo o donde quieras.
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

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', pb: 1 }}>
        Holgura. Uso no comercial (PolyForm Noncommercial 1.0.0).
      </Typography>
    </Stack>
  );
};
