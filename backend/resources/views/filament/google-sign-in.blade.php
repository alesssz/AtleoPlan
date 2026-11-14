{{--
    "Continue with Google" under the admin panel's login form, for an admin
    who signed up with Google and has no password. Inserted by a render hook in AdminPanelProvider.

    `to=admin` brings an admin back to the panel; an error comes back here as
    ?google_error=<reason>.

    Filament's stylesheet is prebuilt, so Tailwind classes it does not use
    would have no effect: the styles are inline, with Filament's variables.
--}}
@if (filled(config('services.google.client_id')))
    {{-- Only the four known reasons: anything else typed in the address is ignored --}}
    @php($error = in_array(request()->query('google_error'), ['cancelled', 'failed', 'unverified', 'disabled'], true) ? request()->query('google_error') : null)

    <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        @if ($error)
            <p role="alert" style="font-size: 0.875rem; color: var(--danger-600);">
                {{ __("admin.google.errors.{$error}") }}
            </p>
        @endif

        <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--gray-500);">
            <span style="flex: 1; height: 1px; background: var(--gray-200);"></span>
            {{ __('admin.google.or') }}
            <span style="flex: 1; height: 1px; background: var(--gray-200);"></span>
        </div>

        {{-- The page's language goes along, for a new account --}}
        <x-filament::button
            tag="a"
            :href="'/auth/google/redirect?to=admin&locale=' . app()->getLocale()"
            color="gray"
            outlined
            size="lg"
        >
            <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                {{-- The same mark as frontend/src/components/GoogleSignIn.tsx --}}
                <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {{ __('admin.google.continue') }}
            </span>
        </x-filament::button>
    </div>
@endif
