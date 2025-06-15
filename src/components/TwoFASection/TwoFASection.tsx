import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import AccordionDetails from "@mui/material/AccordionDetails";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { enableTwoFA, disableTwoFA } from "../../services/userService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/errorUtils";
import axios from "axios";

interface TwoFASectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function TwoFASection({ enabled, onToggle }: TwoFASectionProps): JSX.Element {
  const { t } = useTranslation('dashboard');
  const token = useAuthStore((state) => state.authToken);
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<"enable"|"disable">("enable");

  // Pour enable: données renvoyées
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Pour disable: saisie code
  const [codeType, setCodeType] = useState<"otp"|"recovery">("otp");
  const [otpCode, setOtpCode] = useState<string>('');
  const [dialogErrorMsg, setDialogErrorMsg] = useState<string | null>(null);

  const handleAccordionChange = () => {
    if (expanded) {
      setErrorMsg(null);
      setSuccessMsg(null);
    }
    setExpanded(prev => !prev);
  };

  const handleToggleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDialogErrorMsg(null);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (!enabled) {
      // Activation sans OTP de confirmation
      setLoading(true);
      try {
        const resp = await enableTwoFA(token);
        if (resp.status === 200 && resp.data.qrCodeUrl) {
          // On marque directement enabled
          onToggle(true);
          setSuccessMsg(t('success.2faEnabled'));
          // Stocker données pour le dialog
          setQrCodeUrl(resp.data.qrCodeUrl);
          setSecret(resp.data.secret || null);
          setDialogMode("enable");
          setDialogOpen(true);
        } else {
          setErrorMsg(t('errors.generic_error'));
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.data?.code) {
          setErrorMsg(getErrorMessage(t, err.response.data.code));
        } else {
          setErrorMsg(getErrorMessage(t, 'network_error'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Désactivation : ouvrir dialog
      setDialogMode("disable");
      setCodeType("otp");
      setOtpCode('');
      setDialogErrorMsg(null);
      setDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    setDialogErrorMsg(null);
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (dialogMode === "disable") {
      // Vérifier qu'un code est saisi selon type
      if (codeType === "otp" && !otpCode) {
        setDialogErrorMsg(t('errors.otpRequired'));
        return;
      }
    }
    setLoading(true);
    try {
      if (dialogMode === "disable") {
        const payload: any = {};
        if (codeType === "otp") payload.twofa_code = otpCode;
        const resp = await disableTwoFA(token, otpCode);
        if (resp.status === 204) {
          onToggle(false);
          setSuccessMsg(t('success.2faDisabled'));
          setDialogOpen(false);
          // nettoyer états disable
          setOtpCode('');
          setExpanded(false);
        } else {
          setDialogErrorMsg(t('errors.generic_error'));
        }
      } else {
        // Activation : on ne gère pas confirm ici, car activation déjà faite au clic
        setDialogOpen(false);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.data?.code) {
        setDialogErrorMsg(getErrorMessage(t, err.response.data.code));
      } else {
        setDialogErrorMsg(getErrorMessage(t, 'network_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // En activation, on garde l’état enabled mais l’utilisateur doit avoir scanné ou utiliser recoveryCodes plus tard
    setOtpCode('');
    setDialogErrorMsg(null);
    setQrCodeUrl(null);
    setSecret(null);
  };

  return (
    <>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography>{t('sections.twoFA')}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={handleToggleClick}
                  disabled={loading}
                />
              }
              label={enabled ? t('enabled') : t('disabled')}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {errorMsg && <Typography color="error">{errorMsg}</Typography>}
          {successMsg && <Typography color="success.main">{successMsg}</Typography>}
          <Typography variant="body2">
            {enabled ? t('info.2faEnabled') : t('info.2faDisabled')}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogMode === "enable" ? t('dialog.enable2faTitle') : t('dialog.disable2faTitle')}
        </DialogTitle>
        <DialogContent>
          {dialogMode === "enable" && qrCodeUrl && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('dialog.scanQRCodeWithoutConfirm')}
              </Typography>
              <Box component="img" src={qrCodeUrl} alt="QR Code" sx={{ mx: 'auto', width: 200, height: 200 }} />
              {secret && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {t('dialog.secret')}: {secret}
                </Typography>
              )}
            </Box>
          )}
          {dialogMode === "disable" && (
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('dialog.enterCodeToDisable')}
              </Typography>
              {/* Choix OTP ou recovery */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  variant={codeType === "otp" ? "contained" : "outlined"}
                  onClick={() => setCodeType("otp")}
                  disabled={loading}
                >
                  {t('dialog.useOtp')}
                </Button>
                <Button
                  variant={codeType === "recovery" ? "contained" : "outlined"}
                  onClick={() => setCodeType("recovery")}
                  disabled={loading}
                >
                  {t('dialog.useRecoveryCode')}
                </Button>
              </Box>
              <TextField
                label={t('fields.otpCode')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                fullWidth
                type="text"
                margin="normal"
              />
              {dialogErrorMsg && <Typography color="error" sx={{ mt: 1 }}>{dialogErrorMsg}</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading || (dialogMode === "disable" && (codeType==="otp" && !otpCode))}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {t('buttons.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
