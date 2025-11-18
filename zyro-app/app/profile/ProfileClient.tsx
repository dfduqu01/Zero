'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';
import { LATIN_AMERICAN_COUNTRIES } from '@/lib/constants/countries';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  country: string;
  is_admin: boolean;
  created_at: string;
}

interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  country: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  payment_status: string;
}

interface ProfileClientProps {
  user: User;
  profile: UserProfile | null;
  addresses: UserAddress[];
  orders: Order[];
}

type DashboardView = 'panel' | 'orders' | 'profile' | 'addresses' | 'wishlist';

export default function ProfileClient({
  user,
  profile,
  addresses: initialAddresses,
  orders,
}: ProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // View state
  const [currentView, setCurrentView] = useState<DashboardView>('panel');

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [profileCountry, setProfileCountry] = useState(profile?.country || 'México');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address management
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    country: 'México',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    is_default: false,
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Handle profile update
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileName,
          phone: profilePhone,
          country: profileCountry,
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditingProfile(false);
      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el perfil'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Handle add/edit address
  const handleSaveAddress = async () => {
    setIsSavingAddress(true);
    setAddressError(null);

    try {
      // Validation
      if (
        !addressForm.full_name.trim() ||
        !addressForm.phone.trim() ||
        !addressForm.address_line_1.trim() ||
        !addressForm.city.trim() ||
        !addressForm.state_province.trim() ||
        !addressForm.postal_code.trim()
      ) {
        setAddressError('Todos los campos son requeridos');
        setIsSavingAddress(false);
        return;
      }

      if (editingAddressId) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update(addressForm)
          .eq('id', editingAddressId);

        if (error) throw error;

        // Update local state
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddressId ? { ...addr, ...addressForm } : addr
          )
        );

        setEditingAddressId(null);
      } else {
        // Create new address
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            ...addressForm,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setAddresses((prev) => [data, ...prev]);
        setIsAddingAddress(false);
      }

      // Reset form
      setAddressForm({
        full_name: '',
        phone: '',
        country: 'México',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state_province: '',
        postal_code: '',
        is_default: false,
      });

      router.refresh();
    } catch (error) {
      setAddressError(
        error instanceof Error
          ? error.message
          : 'Error al guardar la dirección'
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      // Update local state
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error al eliminar la dirección');
    }
  };

  // Handle set default address
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      // Unset all default addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      // Update local state
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === addressId,
        }))
      );

      router.refresh();
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Error al establecer dirección predeterminada');
    }
  };

  // Start editing address
  const startEditingAddress = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name,
      phone: address.phone,
      country: address.country,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state_province: address.state_province,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setIsAddingAddress(true);
  };

  // Cancel address form
  const cancelAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddressError(null);
    setAddressForm({
      full_name: '',
      phone: '',
      country: 'México',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state_province: '',
      postal_code: '',
      is_default: false,
    });
  };

  // Render sidebar navigation
  const renderSidebar = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">Mi Cuenta</h2>
      <nav className="space-y-2">
        <button
          onClick={() => setCurrentView('panel')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            currentView === 'panel'
              ? 'bg-black text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Panel
        </button>
        <button
          onClick={() => setCurrentView('orders')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            currentView === 'orders'
              ? 'bg-black text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Pedidos
        </button>
        <button
          onClick={() => setCurrentView('profile')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            currentView === 'profile'
              ? 'bg-black text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setCurrentView('addresses')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            currentView === 'addresses'
              ? 'bg-black text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Direcciones
        </button>
        <button
          onClick={() => setCurrentView('wishlist')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            currentView === 'wishlist'
              ? 'bg-black text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Lista de Deseos
        </button>
        <div className="pt-4 border-t mt-4">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </div>
  );

  // Render Panel/Dashboard view
  const renderPanelView = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido de nuevo, {profile?.name?.split(' ')[0]}! 👋
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-sm text-gray-600 mb-1">Pedidos Pendientes</p>
              <p className="text-3xl font-bold">
                {orders.filter((o) => o.status === 'pending' || o.status === 'processing').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">♡</div>
              <p className="text-sm text-gray-600 mb-1">Lista de Deseos</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedidos Recientes</CardTitle>
            <button
              onClick={() => setCurrentView('orders')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ver Todos los Pedidos →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">No tienes pedidos aún</p>
              <Button onClick={() => router.push('/products')}>
                Explorar Productos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const getStatusBadge = (status: string) => {
                  const badges = {
                    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
                    processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
                    shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
                    delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
                    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
                  };
                  return badges[status as keyof typeof badges] || badges.pending;
                };
                const statusBadge = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-sm">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setCurrentView('profile')}
              variant="outline"
              className="flex items-center gap-2"
            >
              📝 Editar Perfil
            </Button>
            <Button
              onClick={() => setCurrentView('addresses')}
              variant="outline"
              className="flex items-center gap-2"
            >
              📍 Gestionar Direcciones
            </Button>
            <Button
              onClick={() => setCurrentView('wishlist')}
              variant="outline"
              className="flex items-center gap-2"
            >
              ♡ Lista de Deseos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>{' '}
              <span className="font-medium">{profile?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>{' '}
              <span className="font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Teléfono:</span>{' '}
              <span className="font-medium">{profile?.phone}</span>
            </div>
            <div>
              <span className="text-gray-600">País:</span>{' '}
              <span className="font-medium">{profile?.country}</span>
            </div>
            <div>
              <span className="text-gray-600">Miembro desde:</span>{' '}
              <span className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Orders view
  const renderOrdersView = () => {
    const getStatusBadge = (status: string) => {
      const badges = {
        pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
        processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
        shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
        delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      };
      return badges[status as keyof typeof badges] || badges.pending;
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Pedidos</CardTitle>
          <CardDescription>
            Tus últimos 5 pedidos • <Button variant="link" className="p-0 h-auto font-normal text-blue-600" onClick={() => router.push('/orders')}>Ver todos →</Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
              <p className="text-gray-600 mb-6">
                ¡Empieza a comprar y tus pedidos aparecerán aquí!
              </p>
              <Button onClick={() => router.push('/products')}>
                Explorar Productos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        ${parseFloat(order.total).toFixed(2)} USD
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        Ver Detalles →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render Wishlist view
  const renderWishlistView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mi Lista de Deseos</CardTitle>
        <CardDescription>Productos guardados para más tarde</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">♡</div>
          <h3 className="text-xl font-semibold mb-2">Tu lista de deseos está vacía</h3>
          <p className="text-gray-600 mb-6">
            Guarda tus productos favoritos para comprarlos después
          </p>
          <Button onClick={() => router.push('/products')}>
            Explorar Productos
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render Profile view
  const renderProfileView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Cuenta</CardTitle>
        <CardDescription>Gestiona tu información personal</CardDescription>
      </CardHeader>
      <CardContent>
            {!isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Nombre</Label>
                  <p className="text-gray-900 font-medium">{profile?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Correo Electrónico</Label>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Teléfono</Label>
                  <p className="text-gray-900 font-medium">{profile?.phone}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">País</Label>
                  <p className="text-gray-900 font-medium">{profile?.country}</p>
                </div>
                <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                  Editar Perfil
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" value={user.email || ''} disabled />
                  <p className="text-xs text-gray-500 mt-1">
                    El correo no se puede cambiar
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">País</Label>
                  <select
                    id="country"
                    value={profileCountry}
                    onChange={(e) => setProfileCountry(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {LATIN_AMERICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {profileError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {profileError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileName(profile?.name || '');
                      setProfilePhone(profile?.phone || '');
                      setProfileCountry(profile?.country || 'México');
                      setProfileError(null);
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
      </CardContent>
    </Card>
  );

  // Render Addresses view
  const renderAddressesView = () => (
    <div className="space-y-6">
      {/* Addresses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Direcciones de Envío</CardTitle>
                <CardDescription>
                  Gestiona tus direcciones de entrega
                </CardDescription>
              </div>
              {!isAddingAddress && (
                <Button onClick={() => setIsAddingAddress(true)} variant="outline">
                  + Agregar Dirección
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add/Edit Address Form */}
            {isAddingAddress && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-4">
                  {editingAddressId ? 'Editar Dirección' : 'Nueva Dirección'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="full_name">Nombre Completo del Destinatario</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={addressForm.full_name}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_phone">Teléfono</Label>
                    <Input
                      id="address_phone"
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="country_select">País</Label>
                    <select
                      id="country_select"
                      value={addressForm.country}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, country: e.target.value })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {LATIN_AMERICAN_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line_1">Dirección Línea 1 (Calle, Número, Colonia)</Label>
                    <Input
                      id="address_line_1"
                      type="text"
                      value={addressForm.address_line_1}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line_1: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line_2">Dirección Línea 2 (Opcional)</Label>
                    <Input
                      id="address_line_2"
                      type="text"
                      placeholder="Apartamento, Suite, Edificio (opcional)"
                      value={addressForm.address_line_2}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line_2: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="state_province">Estado/Provincia</Label>
                    <Input
                      id="state_province"
                      type="text"
                      value={addressForm.state_province}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, state_province: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                      id="postal_code"
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, postal_code: e.target.value })
                      }
                    />
                  </div>
                </div>

                {addressError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {addressError}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveAddress} disabled={isSavingAddress}>
                    {isSavingAddress ? 'Guardando...' : 'Guardar Dirección'}
                  </Button>
                  <Button onClick={cancelAddressForm} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Addresses List */}
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-600">
                No tienes direcciones guardadas. Agrega una para facilitar tus compras.
              </p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-4 border rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{address.full_name}</h4>
                          {address.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{address.address_line_1}</p>
                        {address.address_line_2 && (
                          <p className="text-sm text-gray-600">{address.address_line_2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state_province} {address.postal_code}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                        <p className="text-sm text-gray-600">{address.phone}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => startEditingAddress(address)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Editar
                        </button>
                        {!address.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(address.id)}
                            className="text-sm text-gray-600 hover:text-gray-700"
                          >
                            Predeterminada
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Left Column */}
      <div className="lg:col-span-1">
        {renderSidebar()}
      </div>

      {/* Main Content - Right Column */}
      <div className="lg:col-span-3">
        {currentView === 'panel' && renderPanelView()}
        {currentView === 'orders' && renderOrdersView()}
        {currentView === 'profile' && renderProfileView()}
        {currentView === 'addresses' && renderAddressesView()}
        {currentView === 'wishlist' && renderWishlistView()}
      </div>
    </div>
  );
}
