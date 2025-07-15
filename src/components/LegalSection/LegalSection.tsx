import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';

interface SectionProps {
  id: string;
  title: string;
  content: string;
  isLast?: boolean;
}

/**
 * Renders a single section of legal content with an anchor, heading, formatted body text (auto-linking URLs and emails), and an optional divider.
 */
export default function LegalSection({
  id,
  title,
  content,
  isLast = false,
}: SectionProps) {
  return (
    <Box id={id} sx={{ mb: 4, scrollMarginTop: theme => theme.mixins.toolbar.minHeight }}>
      {/* Section heading */}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {/* Section body: split on whitespace to auto-link URLs and emails */}
      <Typography
        component="div"
        sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', fontWeight: 200, pl: 2 }}
      >
        {content.split(/(\s+)/).map((seg, i) => {
          if (/https?:\/\/\S+/.test(seg)) {
            return (
              <Link key={i} href={seg} target="_blank" rel="noopener noreferrer">
                {seg}
              </Link>
            );
          }
          // Auto-link email addresses
          if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(seg)) {
            return <Link key={i} href={`mailto:${seg}`}>{seg}</Link>;
          }
          // Otherwise, render the text segment as-is
          return seg;
        })}
      </Typography>

      {/* Divider between sections, omitted for the last one */}
      {!isLast && <Divider sx={{ mt: 5, mb: 0 }} />}
    </Box>
  );
}
