import { useOutletContext } from 'react-router-dom';

import HomeFeedPlaceholder from '../components/home-comp/HomeFeedPlaceholder';

export default function HomePage() {
  const { activeSection, activeSubSection, selectedChatThread, user, setUser, onSelectSection } =
    useOutletContext();
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
      selectedChatThread={selectedChatThread}
      onUserChange={setUser}
      onSelectSection={onSelectSection}
    />
  );
}
