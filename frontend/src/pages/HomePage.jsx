import { useOutletContext } from 'react-router-dom';

import HomeFeedPlaceholder from '../components/home-comp/HomeFeedPlaceholder';
import { useStoredUser } from '../hooks/useStoredUser';

export default function HomePage() {
  const { activeSection } = useOutletContext();
  const user = useStoredUser();
  const displayName =
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'bạn';

  return <HomeFeedPlaceholder displayName={displayName} section={activeSection} />;
}
