import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { SingleUpload } from './SingleUpload';
import { MultiUpload } from './MultiUpload';
import { AvatarUpload } from './AvatarUpload';
import { PackageUpload } from './PackageUpload';

export default function DropzonePage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack spacing={3}>
          <PackageUpload />
          <MultiUpload />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
          <AvatarUpload />
          <SingleUpload />
        </Stack>
      </Grid>
    </Grid>
  );
}
