# Compatibility shim for Ruby 4.0+
# The tainted?/taint/untaint methods were removed in Ruby 3.2+
# but Liquid 4.x still references them.
unless String.method_defined?(:tainted?)
  class String
    def tainted?
      false
    end
  end
end
