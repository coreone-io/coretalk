import { Box, Text } from 'folds';
import { versionLabel } from '$utils/platform';
import * as css from './styles.css';

export function AuthFooter() {
  return (
    <Box className={css.AuthFooter} justifyContent="Center" gap="400" wrap="Wrap">
      <Text size="T300" priority="300">
        {SABLE_PRODUCT_NAME}
      </Text>
      <Text size="T300" priority="300">
        {versionLabel()}
      </Text>
      <Text as="a" size="T300" href="https://matrix.org" target="_blank" rel="noreferrer">
        Powered by Matrix
      </Text>
    </Box>
  );
}
