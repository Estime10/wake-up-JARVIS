import Cocoa

/// Touches média système (comme le clavier) — sans activer d'app.
/// NX_KEYTYPE: PLAY=16, NEXT=17, PREVIOUS=18
/// Un seul tap (session) : doubler HID+session faisait un double-toggle play/pause.
func postMediaKey(_ key: Int32) {
  func post(down: Bool) {
    let flags = NSEvent.ModifierFlags(rawValue: down ? 0x0A00 : 0x0B00)
    let data1 = Int((Int(key) << 16) | ((down ? 0xA : 0xB) << 8))
    guard
      let nsEvent = NSEvent.otherEvent(
        with: .systemDefined,
        location: .zero,
        modifierFlags: flags,
        timestamp: ProcessInfo.processInfo.systemUptime,
        windowNumber: 0,
        context: nil,
        subtype: 8,
        data1: data1,
        data2: -1
      ),
      let cgEvent = nsEvent.cgEvent
    else {
      fputs("create_failed\n", stderr)
      exit(2)
    }
    cgEvent.post(tap: .cgSessionEventTap)
  }

  post(down: true)
  Thread.sleep(forTimeInterval: 0.08)
  post(down: false)
}

let arg = CommandLine.arguments.dropFirst().first ?? "toggle"
switch arg {
case "next":
  postMediaKey(17)
case "previous", "prev":
  postMediaKey(18)
case "toggle":
  postMediaKey(16)
default:
  fputs("usage: sendSystemMediaKey <toggle|next|previous>\n", stderr)
  exit(1)
}

print("ok")
Thread.sleep(forTimeInterval: 0.05)
