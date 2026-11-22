import { HOME_SECTION, type HomeSection, type HomeSubSection } from '../../lib/navigation';
import HomeSectionView from './HomeSectionView';
import FriendsSectionView from '../friend-comp/FriendsSectionView';
import ProfileSectionView from '../profile-comp/ProfileSectionView';
import SettingsSectionView from '../setting-comp/SettingsSectionView';
import ChatSectionView from '../chat-comp/ChatSectionView';
import type {
  AuthUser,
  CallableChat,
  ChatThread,
  OpenChatHandler,
  OpenProfileHandler,
  ProfileTarget,
  User,
} from '../../types';

interface HomeFeedPlaceholderProps {
  user: AuthUser | null | undefined;
  displayName: string;
  section: HomeSection;
  subSection: HomeSubSection | null | undefined;
  selectedChatThread: ChatThread | null | undefined;
  viewedProfile: ProfileTarget | null | undefined;
  onUserChange?: (user: User) => void;
  onOpenProfile?: OpenProfileHandler;
  onSelectSection?: (section: HomeSection) => void;
  onOpenChatWithFriend: OpenChatHandler;
  onStartVoiceCall?: (chat: CallableChat | null) => void;
}

export default function HomeFeedPlaceholder({
  user,
  displayName,
  section,
  subSection,
  selectedChatThread,
  viewedProfile,
  onUserChange,
  onOpenProfile,
  onSelectSection,
  onOpenChatWithFriend,
  onStartVoiceCall,
}: HomeFeedPlaceholderProps) {
  if (section === HOME_SECTION.home) {
    return (
      <HomeSectionView
        displayName={displayName}
        user={user}
        subSection={subSection}
        onOpenProfile={onOpenProfile}
        onSelectSection={onSelectSection}
      />
    );
  }
  if (section === HOME_SECTION.messages) {
    return (
      <ChatSectionView
        selectedChatThread={selectedChatThread}
        onOpenProfile={onOpenProfile}
        user={user}
        onStartVoiceCall={onStartVoiceCall}
      />
    );
  }
  if (section === HOME_SECTION.friends) {
    return (
      <FriendsSectionView
        subSection={subSection}
        onOpenChatWithFriend={onOpenChatWithFriend}
        onOpenProfile={onOpenProfile}
      />
    );
  }
  if (section === HOME_SECTION.profile) {
    return (
      <ProfileSectionView
        displayName={displayName}
        user={user}
        viewedProfile={viewedProfile}
        onUserChange={onUserChange}
        onOpenProfile={onOpenProfile}
        onOpenChat={onOpenChatWithFriend}
      />
    );
  }
  if (section === HOME_SECTION.settings) {
    return <SettingsSectionView subSection={subSection} />;
  }
  return null;
}
