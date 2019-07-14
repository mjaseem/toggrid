package com.mjaseem.toggrid;

import android.webkit.JavascriptInterface;

public class Config {
    private static String APITOKEN ="***REMOVED***";

    @JavascriptInterface
    public String getApiToken() {
        return APITOKEN;
    }
}
