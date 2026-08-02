import type { FC, SVGProps } from 'react';
import {
  AngleLeft,
  AngleRight,
  AngleUp,
  ArrowLeft,
  Ban,
  Bars,
  Book,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle,
  Clock,
  Envelope,
  ExternalLink,
  Eye,
  FilterSlash,
  History,
  Home,
  Link as LinkIconPrime,
  Pause,
  Play,
  PlusCircle,
  Refresh,
  Search,
  Send,
  Shield,
  Spinner,
  Star,
  Sync,
  ThLarge,
  Times,
  TimesCircle,
  Undo,
  Upload,
  User,
  Users,
  Video,
  VolumeUp,
  WavePulse,
  Wifi,
} from '@primeicons/react';

type IconProps = {
  size?: number | string;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, 'ref' | 'width' | 'height'>;

function withSize(Icon: FC<IconProps>, defaultSize = 18): FC<IconProps> {
  return function SizedIcon({ size = defaultSize, ...rest }) {
    return <Icon size={size} {...rest} />;
  };
}

export const PlayIcon = withSize(Play);
export const PauseIcon = withSize(Pause);
export const ExternalIcon = withSize(ExternalLink);
export const BookIcon = withSize(Book);
export const ChevronUpIcon = withSize(AngleUp);
export const CloseIcon = withSize(Times);
export const ArrowLeftIcon = withSize(ArrowLeft);
export const PlusCircleIcon = withSize(PlusCircle);
export const MusicIcon = withSize(VolumeUp);
export const UploadIcon = withSize(Upload);
export const LinkIcon = withSize(LinkIconPrime);
export const BroadcastIcon = withSize(Wifi);

export {
  AngleLeft,
  AngleRight,
  AngleUp,
  ArrowLeft,
  Ban,
  Bars,
  Book,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle,
  Clock,
  Envelope,
  ExternalLink,
  Eye,
  FilterSlash,
  History,
  Home,
  LinkIconPrime as Link,
  Pause,
  Play,
  PlusCircle,
  Refresh,
  Search,
  Send,
  Shield,
  Spinner,
  Star,
  Sync,
  ThLarge,
  Times,
  TimesCircle,
  Undo,
  Upload,
  User,
  Users,
  Video,
  VolumeUp,
  WavePulse,
  Wifi,
};
