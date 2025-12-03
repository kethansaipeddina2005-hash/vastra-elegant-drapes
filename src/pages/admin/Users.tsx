import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Users, Shield, ShieldOff, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  email?: string;
  isAdmin: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [confirmAction, setConfirmAction] = useState<'add' | 'remove' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Map profiles with admin status
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        isAdmin: adminUserIds.has(profile.id),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: 'admin' });

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already an admin');
          return;
        }
        throw error;
      }

      toast.success(`${selectedUser.full_name || 'User'} is now an admin`);
      fetchUsers();
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Failed to update user role');
    } finally {
      setProcessing(false);
      setSelectedUser(null);
      setConfirmAction(null);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedUser) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', 'admin');

      if (error) throw error;

      toast.success(`Admin access removed from ${selectedUser.full_name || 'User'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to update user role');
    } finally {
      setProcessing(false);
      setSelectedUser(null);
      setConfirmAction(null);
    }
  };

  const openConfirmDialog = (user: UserProfile, action: 'add' | 'remove') => {
    setSelectedUser(user);
    setConfirmAction(action);
  };

  if (adminLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(user.created_at), 'dd MMM yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-primary">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openConfirmDialog(user, 'remove')}
                          >
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Remove Admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmDialog(user, 'add')}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => { setConfirmAction(null); setSelectedUser(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === 'add' ? 'Make User Admin?' : 'Remove Admin Access?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === 'add' ? (
                  <>
                    This will give <strong>{selectedUser?.full_name || 'this user'}</strong> full admin access to manage products, orders, customers, and other admin features.
                  </>
                ) : (
                  <>
                    This will remove admin access from <strong>{selectedUser?.full_name || 'this user'}</strong>. They will no longer be able to access admin features.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction === 'add' ? handleMakeAdmin : handleRemoveAdmin}
                disabled={processing}
                className={confirmAction === 'remove' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {processing ? (
                  <Loading size="sm" />
                ) : confirmAction === 'add' ? (
                  'Make Admin'
                ) : (
                  'Remove Admin'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminUsers;
