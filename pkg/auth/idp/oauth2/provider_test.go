// This file is part of MinIO Console Server
// Copyright (c) 2020 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

package oauth2

import (
	"context"
	"net/http"
	"testing"

	"github.com/coreos/go-oidc"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

type Oauth2configMock struct{}

var oauth2ConfigExchangeMock func(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
var oauth2ConfigAuthCodeURLMock func(state string, opts ...oauth2.AuthCodeOption) string
var oauth2ConfigPasswordCredentialsTokenMock func(ctx context.Context, username string, password string) (*oauth2.Token, error)
var oauth2ConfigClientMock func(ctx context.Context, t *oauth2.Token) *http.Client
var oauth2ConfigokenSourceMock func(ctx context.Context, t *oauth2.Token) oauth2.TokenSource

func (ac Oauth2configMock) Exchange(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return oauth2ConfigExchangeMock(ctx, code, opts...)
}

func (ac Oauth2configMock) AuthCodeURL(state string, opts ...oauth2.AuthCodeOption) string {
	return oauth2ConfigAuthCodeURLMock(state, opts...)
}

func (ac Oauth2configMock) PasswordCredentialsToken(ctx context.Context, username string, password string) (*oauth2.Token, error) {
	return oauth2ConfigPasswordCredentialsTokenMock(ctx, username, password)
}

func (ac Oauth2configMock) Client(ctx context.Context, t *oauth2.Token) *http.Client {
	return oauth2ConfigClientMock(ctx, t)
}

func (ac Oauth2configMock) TokenSource(ctx context.Context, t *oauth2.Token) oauth2.TokenSource {
	return oauth2ConfigokenSourceMock(ctx, t)
}

func TestGenerateLoginURL(t *testing.T) {
	funcAssert := assert.New(t)
	oauth2Provider := Provider{
		oauth2Config: Oauth2configMock{},
		oidcProvider: &oidc.Provider{},
	}
	// Test-1 : GenerateLoginURL() generates URL correctly with provided state
	oauth2ConfigAuthCodeURLMock = func(state string, opts ...oauth2.AuthCodeOption) string {
		// Internally we are testing the private method getRandomStateWithHMAC, this function should always returns
		// a non-empty string
		return state
	}
	url := oauth2Provider.GenerateLoginURL()
	funcAssert.NotEqual("", url)
}

func TestVerifyIdentity(t *testing.T) {
	ctx := context.Background()
	funcAssert := assert.New(t)
	// mock data
	oauth2Provider := Provider{
		oauth2Config: Oauth2configMock{},
		oidcProvider: &oidc.Provider{},
	}
	// Test-1 : VerifyIdentity() should fail because of bad state token
	_, err := oauth2Provider.VerifyIdentity(ctx, "AAABBBCCCDDDEEEFFF", "badtoken")
	funcAssert.NotNil(err)
	// Test-2 : VerifyIdentity() should fail because no id_token is provided by the idp
	oauth2ConfigExchangeMock = func(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
		return &oauth2.Token{}, nil
	}
	state := GetRandomStateWithHMAC(32)
	code := "AAABBBCCCDDDEEEFFF"
	_, err = oauth2Provider.VerifyIdentity(ctx, code, state)
	funcAssert.NotNil(err)
	// Test-3 : VerifyIdentity() should fail because no id_token is provided by the idp
	// TODO
	// Test-4 : VerifyIdentity() should fail because oidcProvider.Verifier returned an error
	// TODO
	// Test-5 : VerifyIdentity() should fail because idToken.Claims contains invalid fields
	// TODO
}
