import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import { PageWrapper } from "../components/PageWrapper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import OlympicLoader from "../components/OlympicLoader";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQrScanner } from "../hooks/useQrScanner";
import { getTicketStatusChipColor } from "../utils/ticket";

interface TicketInfo {
  token: string;
  status: string;
  user: { firstname: string; lastname: string; email: string };
  event: { name: string; date: string; time: string; location: string; places: number };
  used_at?: string;
  ticket_token: string;
}

/**
 * EmployeeScanPage is the page where employees can scan tickets or enter them manually.
 * It allows employees to validate tickets by scanning QR codes or entering the ticket token manually.
 * It fetches ticket information from the server and displays it, allowing employees to validate the ticket status.
 * It also handles errors and provides a reset functionality to clear the state and restart the scanning process.
 */
export default function EmployeeScanPage() {
  const { t } = useTranslation('employee');
  const authToken = useAuthStore((state) => state.authToken);
  const lang = useLanguageStore(state => state.lang);
  const qrRegionId = "qr-reader";

  // Local state for token input, fetched ticket, errors and flags
  const [manualToken, setManualToken] = useState("");
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Initialize QR scanner
  const { start: startScanner, stop: stopScanner } = useQrScanner(
    "qr-reader",
    (decoded) => {
      stopScanner();
      fetchTicketInfo(decoded);
    },
    () => setError(t("scan.camera_error"))
  );

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Fetch ticket details by token
  const fetchTicketInfo = (scannedToken: string) => {
    setFetching(true);
    setValidated(false);
    setError(null);
    axios.get<TicketInfo>(
      `${API_BASE_URL}/api/tickets/scan/${scannedToken}`, 
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Accept-Language': lang } }
    )
    .then((res) => setTicketInfo({ ...res.data, ticket_token: scannedToken }))
    .catch((e) => {
      if (e.response?.status === 404) {
        setError(t("scan.not_found"));
      } else {
        setError(t("scan.fetch_error"));
      }
    })
    .finally(() => {
      setFetching(false);
      setManualToken(""); 
    });
  };

  // Handle manual token submission
  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      stopScanner();
      fetchTicketInfo(manualToken.trim());
    }
  };

  // Send validation request
  const validateTicket = () => {
    setValidating(true);
    setValidated(false);
    axios
      .post(`${API_BASE_URL}/api/tickets/scan/${ticketInfo!.token}`, {}, { headers: { 'Authorization': `Bearer ${authToken}`, 'Accept-Language': lang } })
      .then((res) => {
        setTicketInfo((prev) => ({ ...prev!, ...res.data }));
        setValidated(true);
      })
      .catch((_e) => {
        setError(t("errors.validate_error"));
      })
      .finally(() => 
        setValidating(false));
  };

  // Reset to initial scan state
  const handleReset = () => {
    setFetching(false);
    setTicketInfo(null);
    setError(null);
    setValidated(false);
    setManualToken("");
    setValidating(false);
    startScanner();
  };

  // Show error page
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

  // Show loader while fetching ticket info
  if (fetching) {
    return (
      <PageWrapper disableCard>
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <OlympicLoader />
          <Typography variant="h5" sx={{ mt: 2 }}>
            {t("scan.fetching")}
          </Typography>
        </Card>
      </PageWrapper>
    );
  }

  // Main render: either scanner/manual input or ticket details
  return (
    <>
      <Seo title={t("seo.title")} description={t("seo.description")} />
      <PageWrapper disableCard>
        <Card sx={{ p:2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Scanner & manual entry */}
          {!ticketInfo && !error && (
            <>
              <Typography variant="h4" gutterBottom>
                {t("scan.title")}
              </Typography>
              <CardContent sx={{ textAlign: "center" }}>
                {/* SCANNER */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("scan.scan_instructions")}
                </Typography>
                <Box
                  id={qrRegionId}
                  sx={{
                    width: {
                      xs: 200, 
                      sm: 250,   
                      md: 300,   
                    },
                    height: {
                      xs: 200,
                      sm: 250,
                      md: 300,
                    },
                    mx: "auto"
                  }}
                />
                {/* CHAMP MANUEL */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("scan.instructions_manual")}
                </Typography>
                <Box
                  component="form"
                  onSubmit={e => {
                    e.preventDefault();
                    handleManualSubmit();
                  }}
                  sx={{ mb: 3, display: "flex", flexDirection: 'column', gap: 1, justifyContent: "center" }}
                >
                  <FilterField
                    label={t("scan.manual_label")}
                    value={manualToken}
                    onChange={setManualToken}
                  />
                  <Button type="submit" variant="contained">
                    {t("scan.manual_button")}
                  </Button>
                </Box>
              </CardContent>
            </>
          )}

          {/* Ticket details & validation */}
          {ticketInfo && (
            <>
              <Typography variant="h4" gutterBottom>
                  {validated ? t("scan.validated_title") : t("scan.verification_title")}
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
                  {/* Reset button */}
                  <Button variant="contained" onClick={handleReset} sx={{ mt: 5 }}>
                    {t("scan.reset_button")}
                  </Button>
                </Box>
              )}

              {/* Ticket details when not validated */}
              {!validated && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("scan.verification_instructions")}
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
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {t("scan.event_places", { places: ticketInfo.event.places })}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      {t("scan.ticket_token", { token: ticketInfo.ticket_token })}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t("scan.token", { token: ticketInfo.token })}
                    </Typography>

                    {/* Display used date if ticket is already used */}
                    {ticketInfo.status === "issued" ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="contained"
                          sx={{ mt: 2, alignSelf: "flex-end" }}
                          onClick={validateTicket}
                          disabled={validating}
                          startIcon={validating ? <CircularProgress size={20} /> : null}
                        >
                          {validating ? t("scan.validating") : t("scan.validate_button")}
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="contained"
                          sx={{ mt: 2, alignSelf: "flex-end" }}
                          onClick={handleReset}
                        >
                          {t("scan.reset_button")}
                        </Button>
                      </Box>
                    )}
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