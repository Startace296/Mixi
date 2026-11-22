import { useOutletContext } from 'react-router-dom';

import HomeFeedPlaceholder from '../components/home-comp/HomeFeedPlaceholder';
import type { MainOutletContext } from '../layouts/MainLayout';

export default function HomePage() {
  const {
    activeSection,
    activeSubSection,
    selectedChatThread,
    viewedProfile,
    user,
    setUser,
    onOpenProfile,
    onSelectSection,
    onOpenChatWithFriend,
    onStartVoiceCall,
  } = useOutletContext<MainOutletContext>();
  const displayName =
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'you';

  return (
    <HomeFeedPlaceholder
      user={user}
      displayName={displayName}
      section={activeSection}
      subSection={activeSubSection}
      selectedChatThread={selectedChatThread}
      viewedProfile={viewedProfile}
      onUserChange={setUser}
      onOpenProfile={onOpenProfile}
      onSelectSection={onSelectSection}
      onOpenChatWithFriend={onOpenChatWithFriend}
      onStartVoiceCall={onStartVoiceCall}
    />
  );
}
