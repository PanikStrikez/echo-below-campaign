import Foundation
import Vision
import AppKit
let folder = CommandLine.arguments[1]
for name in try FileManager.default.contentsOfDirectory(atPath: folder).filter({$0.hasSuffix(".png")}).sorted() {
    let url = URL(fileURLWithPath: folder).appendingPathComponent(name)
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["en-US"]
    try VNImageRequestHandler(url: url).perform([req])
    let lines = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }
    let record: [String: Any] = ["page": Int(name.dropLast(4).suffix(2)) ?? 0, "text": lines.joined(separator: "\n")]
    let data = try JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
}
