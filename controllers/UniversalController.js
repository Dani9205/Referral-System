exports.handleDeepLink = (req, res) => {
  const { type, id } = req.params;

  // Check the user-agent to determine the platform
  const userAgent = req.headers["user-agent"] || "";
    console.log(`Deep Link Request: ${req.params.type}, ${req.params.id}`);
    console.log(`User-Agent: ${req.headers["user-agent"]}`);

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    // Redirect to the App Store if the app is not installed
    res.redirect("https://play.google.com/store/apps/details?id=com.appistan.chat");
  } else if (/Android/i.test(userAgent)) {
    // Redirect to the Play Store if the app is not installed
    res.redirect("https://play.google.com/store/apps/details?id=com.appistan.The-School-of-Horse");
  } else {
    // Fallback to a web page for unsupported platforms
    res.sendFile("public/fallback.html", { root: "." });
  }
};
