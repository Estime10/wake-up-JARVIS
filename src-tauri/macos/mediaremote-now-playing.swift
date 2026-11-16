import Foundation

/// Now Playing système via MediaRemote — sans Automatisation System Events.
/// Sortie : `title\tartist\talbum` (vide si indisponible).

let url = URL(fileURLWithPath: "/System/Library/PrivateFrameworks/MediaRemote.framework")
guard let bundle = CFBundleCreate(kCFAllocatorDefault, url as CFURL) else { exit(0) }

func sym<T>(_ name: String) -> T? {
  guard let raw = CFBundleGetFunctionPointerForName(bundle, name as CFString) else {
    return nil
  }
  return unsafeBitCast(raw, to: T.self)
}

typealias MRGet = @convention(c) (DispatchQueue, @escaping (CFDictionary?) -> Void) -> Void
typealias MRReg = @convention(c) (DispatchQueue) -> Void

if let reg: MRReg = sym("MRMediaRemoteRegisterForNowPlayingNotifications") {
  reg(DispatchQueue.global())
  Thread.sleep(forTimeInterval: 0.35)
}

guard let getInfo: MRGet = sym("MRMediaRemoteGetNowPlayingInfo") else { exit(0) }

let sem = DispatchSemaphore(value: 0)
var title = ""
var artist = ""
var album = ""

getInfo(DispatchQueue.global()) { info in
  defer { sem.signal() }
  guard let dict = info as? [String: Any] else { return }
  title = dict["kMRMediaRemoteNowPlayingInfoTitle"] as? String ?? ""
  artist = dict["kMRMediaRemoteNowPlayingInfoArtist"] as? String ?? ""
  album = dict["kMRMediaRemoteNowPlayingInfoAlbum"] as? String ?? ""
}

_ = sem.wait(timeout: .now() + 2.5)
if title.isEmpty, artist.isEmpty {
  exit(0)
}
print("\(title)\t\(artist)\t\(album)")
