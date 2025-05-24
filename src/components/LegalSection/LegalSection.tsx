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

export default function LegalSection({
  id,
  title,
  content,
  isLast = false,
}: SectionProps) {
  return (
    <Box id={id} sx={{ mb: 4, scrollMarginTop: theme => theme.mixins.toolbar.minHeight }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
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
          if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(seg)) {
            return <Link key={i} href={`mailto:${seg}`}>{seg}</Link>;
          }
          return seg;
        })}
      </Typography>
      {!isLast && <Divider sx={{ mt: 5, mb: 0 }} />}
    </Box>
  );
}
