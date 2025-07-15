import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import { PageWrapper } from "../components/PageWrapper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../stores/useAuthStore";
import { useLanguageStore } from "../stores/useLanguageStore";
import { formatDate } from "../utils/format";
import Chip from "@mui/material/Chip";
import { ErrorDisplay } from "../components/ErrorDisplay";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { FilterField } from "../components/FilterField";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getTicketStatusChipColor } from "../utils/ticket";
import CircularProgress from "@mui/material/CircularProgress";

interface TicketInfo {
  token: string;
  status: string;
  user: { firstname: string; lastname: string; email: string };
  event: { name: string; date: string; time: string; location: string; places: number };
  used_at?: string;
  ticket_token: string;
}

/**
 * EmployeeValidatePage component allows employees to validate tickets either by scanning a QR code or entering a token manually.
 * It displays ticket information, handles validation errors, and provides a reset functionality.
 * This page is designed for internal use by employees to manage ticket validation efficiently.
 * It includes features such as:
 * - Manual token entry for ticket validation
 * - Displaying ticket details after validation
 * - Error handling for validation issues
 * - Reset functionality to clear the form and start over
 */
export default function EmployeeValidatePage() {
  const { t } = useTranslation('employee');
  const authToken = useAuthStore((state) => state.authToken);
  const lang = useLanguageStore(state => state.lang);

  // Local state: manual input, fetched info, error and flags
  const [manualToken, setManualToken] = useState("");
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Send validation request to server
  const validateTicket = () => {
    setValidating(true);
    setValidated(false);
    axios
      .post(`${API_BASE_URL}/api/tickets/scan/${manualToken}`, {}, { headers: { 'Authorization': `Bearer ${authToken}`, 'Accept-Language': lang } })
      .then((res) => {
        // On success mark as validated
        setTicketInfo((prev) => ({ ...prev!, ...res.data }));
        setValidated(true);
      })
      .catch((_e) => {
        // Handle conflict vs generic error
        if (_e.response?.status === 409) {
          setTicketInfo(_e.response.data);
        } else {
          setError(t("errors.validate_error"));
        }
      })
      .finally(() => 
        setValidating(false));
  };

  // Reset to initial state for new validation
  const handleReset = () => {
    setTicketInfo(null);
    setError(null);
    setManualToken("");
    setValidated(false);
    setValidating(false);
  };

  // Show error screen
  if (error) {
    return (
      <PageWrapper>
        <ErrorDisplay
          title={t('errors.genericErrorTitle')}
          message={error}
          showRetry={true}
          retryButtonText={t('errors.retry')}
          onRetry={() => {
            window.location.reload();
          }}
          showHome={true}
          homeButtonText={t('errors.home')}
        />
      </PageWrapper>
    );
  }

  // Main render: either manual input form or validation result
  return (
    <>
      <Seo title={t("seo.title_validate")} description={t("seo.description_validate")} />
      <PageWrapper disableCard>
        <Card sx={{ p:2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Manual token entry */}
          {!ticketInfo && !error && (
            <>
              <Typography variant="h4" gutterBottom>
                {t("validate.title")}
              </Typography>
              <CardContent sx={{ textAlign: "center" }}>
                {/* CHAMP MANUEL */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("validate.instructions_manual")}
                </Typography>
                <Box
                  component="form"
                  onSubmit={e => {
                    e.preventDefault();
                    validateTicket();
                  }}
                  sx={{ mb: 3, display: "flex", flexDirection: 'column', gap: 1, justifyContent: "center" }}
                >
                  <FilterField
                    label={t("validate.manual_label")}
                    value={manualToken}
                    onChange={setManualToken}
                  />
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={validating || !manualToken}
                    startIcon={validating ? <CircularProgress size={20} /> : null}
                  >
                    {validating ? t("validate.validating") : t("validate.validate_button")}
                  </Button>
                </Box>
              </CardContent>
            </>
          )}

          {/* Display validation results */}
          {ticketInfo && (
            <>
              <Typography variant="h4" gutterBottom>
                  {validated ? t("scan.validated_title") : t("validate.results_title")}
              </Typography>
              {validated && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 60,        
                      color: 'success.main', 
                      display: 'block',
                      mx: 'auto',          
                      mb: 1,               
                    }}
                  />
                  <Typography variant="h5">
                    {t("scan.validated_message", { dt: formatDate(ticketInfo.used_at, lang) })}
                  </Typography>
                  {/* Reset Button */}
                  <Button variant="contained" onClick={handleReset} sx={{ mt: 5 }}>
                    {t("validate.reset_button")}
                  </Button>
                </Box>
              )}

              {/* If not validated, show ticket details */}
              {!validated && (
                <>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 60,        
                      color: 'error.main', 
                      display: 'block',
                      mx: 'auto',          
                      mb: 1,               
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("validate.not_good")}
                  </Typography>
                  <CardContent sx={{ textAlign: "left" }}>
                    <Typography variant="h6" gutterBottom>
                      <Chip label={t(`scan.status.${ticketInfo.status}`)} color={getTicketStatusChipColor(ticketInfo.status)} size="small" sx={{ marginRight: 1}} />
                      {ticketInfo.event.name }
                    </Typography>
                    <Typography variant="body1">
                      {t("scan.event_date", { date: formatDate(ticketInfo.event.date, lang), time: ticketInfo.event.time, location: ticketInfo.event.location })} 
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {t("scan.client")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ticketInfo.user.firstname} {ticketInfo.user.lastname}<br /> 
                      {ticketInfo.user.email}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        sx={{ mt: 2, alignSelf: "flex-end" }}
                        onClick={handleReset}
                      >
                        {t("validate.reset_button")}
                      </Button>
                    </Box>
                  </CardContent>
                </>
              )}
            </>
          )}
        </Card>
      </PageWrapper>
    </>
  );
}