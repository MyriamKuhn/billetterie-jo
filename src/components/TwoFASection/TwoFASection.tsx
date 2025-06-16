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
import { enableTwoFA, confirmTwoFA, disableTwoFA } from "../../services/userService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/errorUtils";
import axios from "axios";
import { QRCodeSVG } from 'qrcode.react';
import useMediaQuery from "@mui/material/useMediaQuery";

interface TwoFASectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function TwoFASection({ enabled, onToggle }: TwoFASectionProps): JSX.Element {
  const { t } = useTranslation('userDashboard');
  const token = useAuthStore((state) => state.authToken);
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog générique pour enable ou disable ou confirm
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<"enable_prepare"|"enable_confirm"|"disable"|"enable_success">("enable_prepare");

  // Pour activation : données de préparation
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Pour saisie OTP lors de confirm activation ou disable
  const [otpCode, setOtpCode] = useState<string>('');
  const [dialogErrorMsg, setDialogErrorMsg] = useState<string | null>(null);

  // Pour afficher recovery codes après confirmation
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Pour gérer la désactivation avec un OTP ou un code de récupération
  const [codeType, setCodeType] = useState<"otp"|"recovery">("otp");

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
    setRecoveryCodes(null);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (!enabled) {
      // Début de l'activation : étape 1 = préparation
      setLoading(true);
      try {
        const resp = await enableTwoFA(token);
        // suppose status 200 et data { qrCodeUrl, secret, expires_at }
        if (resp.status === 200 && resp.data.qrCodeUrl) {
          // On ouvre le dialog en mode prepare
          setQrCodeUrl(resp.data.qrCodeUrl);
          setSecret(resp.data.secret || null);
          setDialogMode("enable_prepare");
          setDialogOpen(true);
        } else {
          setErrorMsg(getErrorMessage(t, 'generic_error'));
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
      // Désactivation : ouvrir dialog en mode disable
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

    // Validation locale : OTP requis
    if (dialogMode === "enable_confirm") {
      if (!otpCode) {
        setDialogErrorMsg(t('errors.otpRequired'));
        return;
      }
    } else if (dialogMode === "disable") {
      // Selon codeType, on exige otpCode non vide
      if (!otpCode) {
        setDialogErrorMsg(
          codeType === "otp"
            ? t('errors.otpRequired')
            : t('errors.recoveryCodeRequired')
        );
        return;
      }
    }

    setLoading(true);
    try {
      switch (dialogMode) {
        case "enable_prepare":
          // Après avoir affiché QR+secret, on passe à la saisie OTP
          setDialogMode("enable_confirm");
          setOtpCode('');
          break;

        case "enable_confirm":
          {
            // Appel confirm
            const resp = await confirmTwoFA(token, otpCode);
            if (resp.status === 200 && resp.data?.recovery_codes) {
              // Activation réussie
              onToggle(true);
              setSuccessMsg(t('dashboard.2faEnabled'));
              setRecoveryCodes(resp.data.recovery_codes);
              // on peut fermer le dialog ou afficher recovery codes dedans
              // Ici on garde le dialog ouvert et on affiche la liste
              setDialogErrorMsg(null);
              setDialogMode("enable_success");
            } else {
              setErrorMsg(getErrorMessage(t, 'generic_error'));
            }
          }
          break;

        case "disable":
          {
            const resp = await disableTwoFA(token, otpCode);
            if (resp.status === 204) {
              // Désactivation réussie
              onToggle(false);
              setSuccessMsg(t('dashboard.2faDisabled'));
              setDialogOpen(false);
              setOtpCode('');
              setExpanded(false);
            } else {
              // Réponse inattendue
              setErrorMsg(getErrorMessage(t, 'generic_error'));
            }
          }
          break;
      }
    } catch (err: any) {
      // Gestion des erreurs réseau ou backend
      if (axios.isAxiosError(err) && err.response?.data?.code) {
        const errCode = err.response.data.code;
        // Pour disable, si invalid code, on peut différencier le message selon codeType
        if (dialogMode === "disable" && errCode === 'twofa_invalid_code') {
          setDialogErrorMsg(
            codeType === "otp"
              ? t('errors.invalidOtp')
              : t('errors.invalidRecoveryCode')
          );
        } else {
          setDialogErrorMsg(getErrorMessage(t, errCode));
        }
      } else {
        setDialogErrorMsg(getErrorMessage(t, 'network_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setOtpCode('');
    setDialogErrorMsg(null);
    setQrCodeUrl(null);
    setSecret(null);
    setRecoveryCodes(null);
    // Si on fermet en plein flow d'activation, on désactive le switch car non confirmé
    if (dialogMode === "enable_prepare" || dialogMode === "enable_confirm") {
      onToggle(false);
    }
    setDialogMode("enable_prepare");
  };

  return (
    <>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: { xs: 1, sm: 0 } }}>
            <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.2rem' } }}>
              {t('dashboard.twoFA')}
            </Typography>
            {isMobile ? (
              <Switch size="small" checked={enabled} onChange={handleToggleClick} disabled={loading} />
            ) : (
              <FormControlLabel
                control={<Switch size="small" checked={enabled} onChange={handleToggleClick} disabled={loading} />}
                label={enabled ? t('dashboard.enabled') : t('dashboard.disabled')}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {errorMsg && <Typography color="error">{errorMsg}</Typography>}
          {successMsg && <Typography color="success.main">{successMsg}</Typography>}
          <Typography variant="body2">
            {enabled ? t('dashboard.2faEnabled') : t('dashboard.2faDisabled')}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogMode === "disable" && t('dashboard.disable2faTitle')}
          {dialogMode === "enable_prepare" && t('dashboard.enable2faTitle')}
          {dialogMode === "enable_confirm" && t('dashboard.confirm2faTitle')}
        </DialogTitle>
        <DialogContent>
          {/* Activation : étape préparation */}
          {dialogMode === "enable_prepare" && qrCodeUrl && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('dashboard.scanQRCodeWithoutConfirm')}
              </Typography>
              <Box sx={{ mx: 'auto', width: 200, height: 200, backgroundColor: '#fff', p: 1 }}>
                <QRCodeSVG value={qrCodeUrl} size={180} />
              </Box>
              {secret && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', mr: 1 }}>
                    {t('dashboard.secret')}: {secret}
                  </Typography>
                  <Button size="small" onClick={() => { navigator.clipboard.writeText(secret); }}>
                    {t('dashboard.copy')}
                  </Button>
                </Box>
              )}
              <Typography variant="body2" sx={{ mt: 2 }}>
                {t('dashboard.enterOtpAfterScan')}
              </Typography>
            </Box>
          )}
          {/* Activation : étape confirmation OTP */}
          {dialogMode === "enable_confirm" && (
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('dashboard.enterCodeToConfirm')}
              </Typography>
              <TextField
                label={isMobile ? t('dashboard.otpCodeMobile') : t('dashboard.otpCode')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                fullWidth
                type="text"
                margin="normal"
                slotProps={{
                  input: {
                    inputProps: {
                      maxLength: 6,
                    }
                  }
                }}
                placeholder="123456"
              />
              {dialogErrorMsg && <Typography color="error" sx={{ mt: 1 }}>{dialogErrorMsg}</Typography>}
            </Box>
          )}
          {/* Si activation réussie, affiche recovery codes */}
          {dialogMode === "enable_success" && recoveryCodes && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('dashboard.recoveryCodesTitle')}
              </Typography>
              {recoveryCodes.map(code => (
                <Typography key={code} variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {code}
                </Typography>
              ))}
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {t('dashboard.recoveryCodesNote')}
              </Typography>
            </Box>
          )}
          {/* Désactivation */}
          {dialogMode === "disable" && (
            <Box>
              {/* Instruction change selon type */}
              <Typography variant="body2" gutterBottom>
                {codeType === "otp"
                ? t('dashboard.enterCodeToDisable')
                : t('dashboard.enterRecoveryCodeToDisable')}
              </Typography>

              {/* Boutons pour choisir le type de code */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  variant={codeType === "otp" ? "contained" : "outlined"}
                  onClick={() => { setCodeType("otp"); setOtpCode(''); setDialogErrorMsg(null); }}
                  disabled={loading}
                  size="small"
                  sx={{fontSize: {xs: '0.6rem', sm: '0.875rem'} }}
                >
                  {t('dashboard.useOtp')}
                </Button>
                <Button
                  variant={codeType === "recovery" ? "contained" : "outlined"}
                  onClick={() => { setCodeType("recovery"); setOtpCode(''); setDialogErrorMsg(null); }}
                  disabled={loading}
                  size="small"
                  sx={{fontSize: {xs: '0.6rem', sm: '0.875rem'} }}
                >
                  {t('dashboard.useRecoveryCode')}
                </Button>
              </Box>

              {/* Champ de saisie, label et placeholder selon type */}
              <TextField
                label={
                  isMobile
                    ? (codeType === "otp" ? t('dashboard.otpCodeMobile') : t('dashboard.recoveryCodeMobile'))
                    : (codeType === "otp" ? t('dashboard.otpCode') : t('dashboard.recoveryCode'))
                }
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                fullWidth
                type="text"
                margin="normal"
                slotProps={{
                  input: {
                    inputProps: {
                      maxLength: codeType === "otp" ? 6 : 20,
                    },
                  }
                }}
                placeholder={codeType === "otp" ? "123456" : "ABCDEFGHIJ"}
              />
              {dialogErrorMsg && <Typography color="error" sx={{ mt: 1 }}>{dialogErrorMsg}</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            {t('dashboard.cancel')}
          </Button>
          {dialogMode === "enable_prepare" && (
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {t('dashboard.next')}
            </Button>
          )}
          {(dialogMode === "enable_confirm" || dialogMode === "disable") && (
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={loading || !otpCode}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {t('dashboard.confirm')}
            </Button>
          )}
          {dialogMode === "enable_success" && (
            <Button variant="contained" onClick={handleDialogClose}>
              {t('dashboard.done')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

