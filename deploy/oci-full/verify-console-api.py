from datetime import timedelta
from secrets import token_urlsafe
from django.db import transaction
from django.utils.timezone import now
from rest_framework.test import APIClient
from authentik.core.models import User, Application
from authentik.providers.oauth2.models import AccessToken, OAuth2Provider
with transaction.atomic():
    provider=OAuth2Provider.objects.get(client_id='kreeper-console-authentik')
    admin=User.objects.get(username='akadmin')
    regular=User.objects.create(username='console-mfe-permission-check', name='Permission check')
    for user,expected in [(admin,201),(regular,403)]:
        token=token_urlsafe(40)
        AccessToken.objects.create(provider=provider,user=user,token=token,auth_time=now(),expires=now()+timedelta(minutes=5),_scope='openid goauthentik.io/api',_id_token='{}')
        api=APIClient(HTTP_HOST='localhost')
        api.credentials(HTTP_AUTHORIZATION='Bearer '+token)
        response=api.get('/api/v3/core/users/me/')
        assert response.status_code==200,(user.username,response.status_code)
        assert response.data['user']['pk']==user.pk
        response=api.post('/api/v3/core/applications/',{'name':'MFE permission check','slug':'mfe-permission-'+str(user.pk)},format='json')
        assert response.status_code==expected,(user.username,response.status_code)
    bad=token_urlsafe(40)
    AccessToken.objects.create(provider=provider,user=regular,token=bad,auth_time=now(),expires=now()+timedelta(minutes=5),_scope='openid',_id_token='{}')
    api.credentials(HTTP_AUTHORIZATION='Bearer '+bad)
    assert api.get('/api/v3/core/users/me/').status_code in (401,403)
    transaction.set_rollback(True)
assert not User.objects.filter(username='console-mfe-permission-check').exists()
assert not Application.objects.filter(name='MFE permission check').exists()
print('CONSOLE_API_IDENTITY_ADMIN_WRITE_REGULAR_DENIED_SCOPE_REQUIRED_ROLLBACK_OK')
