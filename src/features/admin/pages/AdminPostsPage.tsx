import { PostsTab } from '../posts/PostsTab';

/** AD-01 ②-5 게시물 관리 (`/admin/posts?kind=&q=`). AdminLayout(폭 1120) 안에서 그려지므로 PageContainer를 두지 않는다. */
export default function AdminPostsPage() {
  return <PostsTab />;
}
