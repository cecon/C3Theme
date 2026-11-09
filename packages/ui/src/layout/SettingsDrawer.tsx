import { ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Monitor, Moon, Setting2, Sun1, TickCircle } from 'iconsax-reactjs';

import { useLocales, useUiConfig } from '../config';
import { useUiText } from '../i18n';
import { BRAND_COLORS, BrandColor, DEFAULT_FONT, FONT_OPTIONS } from '../theme/createC3Theme';
import { ANGLE } from '../theme/angle';
import useColorMode from '../theme/useColorMode';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Painel lateral com as preferências de aparência; tudo que muda aqui fica salvo no navegador. */
export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { config, setConfig, reset } = useUiConfig();
  const { preference, setPreference } = useColorMode();
  const locales = useLocales();
  const t = useUiText();

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 360 } } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
        <Typography variant="h5">{t('c3.settings')}</Typography>
        <IconButton aria-label={t('c3.close')} onClick={onClose}>
          <CloseCircle size={20} />
        </IconButton>
      </Stack>
      <Divider />
      <Stack spacing={3} sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
        <Section title={t('c3.settings.mode')}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={preference}
            onChange={(_, v) => v && setPreference(v)}
            aria-label={t('c3.settings.mode')}
          >
            <ToggleButton value="light" sx={{ gap: 0.75 }}>
              <Sun1 size={16} /> {t('c3.settings.mode.light')}
            </ToggleButton>
            <ToggleButton value="dark" sx={{ gap: 0.75 }}>
              <Moon size={16} /> {t('c3.settings.mode.dark')}
            </ToggleButton>
            <ToggleButton value="system" sx={{ gap: 0.75 }}>
              <Monitor size={16} /> {t('c3.settings.mode.system')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Section>

        <Section title={t('c3.settings.look')}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={config.look}
            onChange={(_, v) => v && setConfig({ look: v, fontFamily: undefined })}
            aria-label={t('c3.settings.look')}
          >
            <ToggleButton value="c3">C3</ToggleButton>
            <ToggleButton value="angle">Angle</ToggleButton>
          </ToggleButtonGroup>
        </Section>

        {config.look === 'c3' && (
          <Section title={t('c3.settings.brand')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
              {(Object.keys(BRAND_COLORS) as BrandColor[]).map((key) => (
                <Tooltip key={key} title={t(`c3.brand.${key}`)}>
                  <ButtonBase
                    aria-label={t(`c3.brand.${key}`)}
                    aria-pressed={config.brand === key}
                    onClick={() => setConfig({ brand: key })}
                    sx={(theme) => ({
                      height: 40,
                      borderRadius: 2,
                      color: '#fff',
                      bgcolor: BRAND_COLORS[key].light,
                      ...theme.applyStyles('dark', { bgcolor: BRAND_COLORS[key].dark, color: '#0D1117' }),
                      outline: config.brand === key ? 2 : 0,
                      outlineColor: 'text.primary',
                      outlineOffset: 2
                    })}
                  >
                    {config.brand === key && <TickCircle size={18} variant="Bold" />}
                  </ButtonBase>
                </Tooltip>
              ))}
            </Box>
          </Section>
        )}

        <Section title={t('c3.settings.menu')}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={config.menuOrientation}
            onChange={(_, v) => v && setConfig({ menuOrientation: v })}
            aria-label={t('c3.settings.menu')}
          >
            <ToggleButton value="vertical">{t('c3.settings.menu.vertical')}</ToggleButton>
            <ToggleButton value="rail">{t('c3.settings.menu.rail')}</ToggleButton>
            <ToggleButton value="horizontal">{t('c3.settings.menu.horizontal')}</ToggleButton>
          </ToggleButtonGroup>
          <Stack sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Switch checked={config.miniDrawer} onChange={(e) => setConfig({ miniDrawer: e.target.checked })} />}
              label={t('c3.settings.menu.mini')}
              disabled={config.menuOrientation === 'horizontal'}
            />
            <FormControlLabel
              control={<Switch checked={config.menuCaption} onChange={(e) => setConfig({ menuCaption: e.target.checked })} />}
              label={t('c3.settings.menu.caption')}
              disabled={config.menuOrientation !== 'vertical'}
            />
          </Stack>
        </Section>

        <Section title={t('c3.settings.layout')}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={config.container ? 'container' : 'fluid'}
            onChange={(_, v) => v && setConfig({ container: v === 'container' })}
            aria-label={t('c3.settings.layout')}
          >
            <ToggleButton value="container">{t('c3.settings.layout.container')}</ToggleButton>
            <ToggleButton value="fluid">{t('c3.settings.layout.fluid')}</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            value={config.direction}
            onChange={(_, v) => v && setConfig({ direction: v })}
            aria-label={t('c3.settings.layout')}
          >
            <ToggleButton value="ltr">{t('c3.settings.layout.ltr')}</ToggleButton>
            <ToggleButton value="rtl">{t('c3.settings.layout.rtl')}</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Switch checked={config.contrast} onChange={(e) => setConfig({ contrast: e.target.checked })} />}
            label={t('c3.settings.contrast')}
          />
        </Section>

        <Section title={t('c3.settings.font')}>
          <TextField
            select
            fullWidth
            size="small"
            value={config.fontFamily ?? (config.look === 'angle' ? ANGLE.font : DEFAULT_FONT)}
            onChange={(e) => setConfig({ fontFamily: e.target.value })}
            slotProps={{ select: { SelectDisplayProps: { 'aria-label': t('c3.settings.font') } } }}
          >
            {FONT_OPTIONS.map((f) => (
              <MenuItem key={f.label} value={f.value} sx={{ fontFamily: f.value }}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        </Section>

        {locales.length > 1 && (
          <Section title={t('c3.settings.language')}>
            <TextField
              select
              fullWidth
              size="small"
              value={config.locale}
              onChange={(e) => setConfig({ locale: e.target.value })}
              slotProps={{ select: { SelectDisplayProps: { 'aria-label': t('c3.settings.language') } } }}
            >
              {locales.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.label}
                </MenuItem>
              ))}
            </TextField>
          </Section>
        )}
      </Stack>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          onClick={() => {
            reset();
            setPreference('system');
          }}
        >
          {t('c3.settings.reset')}
        </Button>
      </Box>
    </Drawer>
  );
}

/** Botão do header que abre o painel de aparência. */
export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const t = useUiText();
  return (
    <>
      <Tooltip title={t('c3.settings')}>
        <IconButton aria-label={t('c3.settings')} onClick={() => setOpen(true)}>
          <Setting2 size={20} />
        </IconButton>
      </Tooltip>
      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
