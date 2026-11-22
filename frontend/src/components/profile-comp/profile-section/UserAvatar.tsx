import type { DisplayedProfile } from './profileUtils';
import { getAvatarUrl } from '../../../lib/format';

export default function UserAvatar({ user, size = 'lg', className = '' }: { user: DisplayedProfile | null | undefined; size?: 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClass = size === 'xl' ? 'w-24 h-24' : size === 'lg' ? 'w-20 h-20' : 'w-10 h-10';
  return (
    <img
      src={getAvatarUrl(user?.avatarUrl)}
      alt=""
      onError={(e) => { e.currentTarget.src = '/basic_avatar.jpg'; }}
      className={`${sizeClass} rounded-full object-cover ${className}`}
    />
  );
}
