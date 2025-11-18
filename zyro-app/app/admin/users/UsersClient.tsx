'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  ShieldCheck,
  UserCircle,
  Search,
  Eye,
  ShieldPlus,
  ShieldMinus,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  is_admin: boolean;
  created_at: string;
  order_count: number;
}

interface Stats {
  totalUsers: number;
  adminCount: number;
  customerCount: number;
}

interface UsersClientProps {
  initialUsers: User[];
  stats: Stats;
  currentUserId: string;
}

type UserFilter = 'all' | 'admins' | 'customers';

export default function UsersClient({
  initialUsers,
  stats: initialStats,
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    // Filter by user type
    if (filter === 'admins' && !user.is_admin) return false;
    if (filter === 'customers' && user.is_admin) return false;

    // Search by name, email, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Open user details modal
  const openDetailsModal = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Open confirmation modal for admin toggle
  const openToggleConfirmation = (user: User) => {
    // Prevent self-demotion
    if (user.id === currentUserId && user.is_admin) {
      alert('No puedes quitarte los permisos de administrador a ti mismo.');
      return;
    }

    setUserToToggle(user);
    setShowConfirmModal(true);
  };

  // Toggle admin status
  const handleToggleAdmin = async () => {
    if (!userToToggle) return;

    setIsSubmitting(true);

    try {
      const newAdminStatus = !userToToggle.is_admin;

      const { error } = await supabase
        .from('users')
        .update({ is_admin: newAdminStatus })
        .eq('id', userToToggle.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('Error al actualizar el usuario');
        return;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userToToggle.id ? { ...u, is_admin: newAdminStatus } : u
        )
      );

      // Recalculate stats
      const updatedUsers = users.map((u) =>
        u.id === userToToggle.id ? { ...u, is_admin: newAdminStatus } : u
      );
      const newAdminCount = updatedUsers.filter((u) => u.is_admin).length;
      setStats({
        ...stats,
        adminCount: newAdminCount,
        customerCount: stats.totalUsers - newAdminCount,
      });

      alert(
        newAdminStatus
          ? 'Usuario promovido a administrador exitosamente'
          : 'Permisos de administrador removidos exitosamente'
      );

      setShowConfirmModal(false);
      setUserToToggle(null);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra usuarios y permisos de administrador.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <p className="text-2xl font-bold text-purple-700">{stats.adminCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{stats.customerCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'admins' ? 'default' : 'outline'}
            onClick={() => setFilter('admins')}
            size="sm"
            className="flex items-center gap-1"
          >
            <ShieldCheck className="h-3 w-3" />
            Administradores
          </Button>
          <Button
            variant={filter === 'customers' ? 'default' : 'outline'}
            onClick={() => setFilter('customers')}
            size="sm"
            className="flex items-center gap-1"
          >
            <UserCircle className="h-3 w-3" />
            Clientes
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    País
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          {user.id === currentUserId && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{user.country}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                            <UserCircle className="h-3 w-3 mr-1" />
                            Cliente
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.order_count}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(user)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant={user.is_admin ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => openToggleConfirmation(user)}
                            disabled={user.id === currentUserId && user.is_admin}
                          >
                            {user.is_admin ? (
                              <>
                                <ShieldMinus className="h-3 w-3 mr-1" />
                                Quitar Admin
                              </>
                            ) : (
                              <>
                                <ShieldPlus className="h-3 w-3 mr-1" />
                                Hacer Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalles del Usuario
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
              >
                X
              </Button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Nombre Completo</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser.phone || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">País</p>
                <p className="text-sm font-medium text-gray-900">{selectedUser.country}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Tipo de Usuario</p>
                <div className="mt-1">
                  {selectedUser.is_admin ? (
                    <Badge className="bg-purple-100 text-purple-800">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Administrador
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <UserCircle className="h-3 w-3 mr-1" />
                      Cliente
                    </Badge>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Fecha de Registro</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(selectedUser.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Actividad</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-800">Total de Pedidos:</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedUser.order_count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && userToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Confirmar Acción</h2>
            <p className="text-gray-700">
              {userToToggle.is_admin
                ? `¿Estás seguro de que deseas quitar los permisos de administrador a ${userToToggle.name}?`
                : `¿Estás seguro de que deseas promover a ${userToToggle.name} como administrador?`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false);
                  setUserToToggle(null);
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleToggleAdmin}
                className="flex-1"
                disabled={isSubmitting}
                variant={userToToggle.is_admin ? 'destructive' : 'default'}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
