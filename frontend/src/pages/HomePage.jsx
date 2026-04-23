import { useOutletContext } from 'react-router-dom';

import HomeFeedPlaceholder from '../components/home-comp/HomeFeedPlaceholder';

export default function HomePage() {
  const { activeSection, activeSubSection, user, setUser, onSelectSection } = useOutletContext();
  const displayName =
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'you';

  return (
    <HomeFeedPlaceholder
      user={user}
      displayName={displayName}
      section={activeSection}
      subSection={activeSubSection}
      onUserChange={setUser}
      onSelectSection={onSelectSection}
    />
  );
}
